import React, { useState, useEffect, useRef } from 'react';
import { 
  Menu, Search, Settings, HelpCircle, Grip, User, 
  Inbox, Folder, Clock, FileText, Settings2, PenSquare,
  Minus, Maximize2, X, Paperclip, Link as LinkIcon, Smile, 
  Image as ImageIcon, Trash2, ChevronDown, CheckCircle2,
  AlertCircle, Download, Printer, Copy, Sparkles, Building2
} from 'lucide-react';

// --- INITIAL DATA ---
const DEFAULT_UNIVERSITIES = {
  "CCM": "applymalta.wwedubd@gmail.com",
  "Learn Key": "europeapplybd@gmail.com",
  "TTS": "applymalta.wwedubd@gmail.com",
  "ECI": "lvsimm123@gmail.com",
  "Malita International College": "applymalta.wwedubd@gmail.com",
  "Gateway Institute of Learning": "applymalta.wwedubd@gmail.com"
};

const DEFAULT_TEMPLATE = `Greetings from "Insaf Immigration". We are sending one of Malta's applicants, and the documents are the following:

Applicant Name: {{name}}
Passport Number: {{passport}}
Institution: {{institution}}
Intake: {{intake}}
Preferred Course: {{course}}
Offer Letter Level: {{level}}
Email: {{email}}
Password: {{password}}
Contact Number: {{contact}}

Thanks & Regards
Insaf Immigration`;

export default function ApplicationAssistant() {
  // Application State
  const [activeRoute, setActiveRoute] = useState('malta');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [inputMode, setInputMode] = useState('form');
  const [appData, setAppData] = useState({
    universities: DEFAULT_UNIVERSITIES,
    template: DEFAULT_TEMPLATE,
    history: []
  });
  
  // Form State
  const [formData, setFormData] = useState({
    name: '', passport: '', intake: '', institution: '', 
    course: '', level: '', contact: '', email: '', password: ''
  });
  const [rawText, setRawText] = useState('');

  // Composer State
  const [composerState, setComposerState] = useState({
    isOpen: true,
    isMinimized: false,
    isExpanded: false
  });
  const [composerContent, setComposerContent] = useState({ to: '', subject: '', body: '' });

  // Admin & UI State
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [isAdminAuth, setIsAdminAuth] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [draftsToday, setDraftsToday] = useState(0);
  const [settingsTab, setSettingsTab] = useState('universities');
  
  // Dropdown State
  const [isUniDropdownOpen, setIsUniDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Initialization
  useEffect(() => {
    const checkMobile = () => { if (window.innerWidth < 1024) setIsSidebarOpen(false); };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    // Load local storage data
    const savedConfig = localStorage.getItem('insafAppConfig');
    if (savedConfig) setAppData(JSON.parse(savedConfig));
    
    const savedDraft = localStorage.getItem('appAssistDraft');
    if (savedDraft) setFormData(JSON.parse(savedDraft));

    // Drafts Today
    const stats = JSON.parse(localStorage.getItem('appStats') || '{}');
    const today = new Date().toLocaleDateString();
    setDraftsToday(stats[today] || 0);

    // Click outside handler for custom dropdown
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsUniDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      window.removeEventListener('resize', checkMobile);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Update Composer when Form Data or Template changes
  useEffect(() => {
    localStorage.setItem('appAssistDraft', JSON.stringify(formData));
    
    const inst = formData.institution;
    const mappedEmail = appData.universities[inst] || "";
    const outSubject = (formData.name && formData.passport && inst) ? 
      `${formData.name} | ${formData.passport} | ${inst}` : "";

    let outBody = appData.template;
    const ids = ['name', 'passport', 'intake', 'institution', 'course', 'level', 'contact', 'email', 'password'];
    ids.forEach(id => {
      const regex = new RegExp(`{{${id}}}`, 'gi');
      const val = formData[id] || `[${id}]`;
      outBody = outBody.replace(regex, val);
    });

    setComposerContent({ to: mappedEmail, subject: outSubject, body: outBody });
  }, [formData, appData]);

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  const incrementStats = () => {
    const stats = JSON.parse(localStorage.getItem('appStats') || '{}');
    const today = new Date().toLocaleDateString();
    stats[today] = (stats[today] || 0) + 1;
    localStorage.setItem('appStats', JSON.stringify(stats));
    setDraftsToday(stats[today]);

    // Save to history
    if (formData.name && formData.institution) {
      const newHistory = [{
        id: Date.now(),
        date: new Date().toLocaleString(),
        data: { ...formData }
      }, ...appData.history].slice(0, 50);
      
      const newAppData = { ...appData, history: newHistory };
      setAppData(newAppData);
      localStorage.setItem('insafAppConfig', JSON.stringify(newAppData));
    }
  };

  const handleAuth = () => {
    if (adminPassword === 'insafadmin') {
      setIsAdminAuth(true);
      setAuthModalOpen(false);
      setActiveRoute('settings');
      setAuthError('');
      setAdminPassword('');
    } else {
      setAuthError('Incorrect password');
    }
  };

  const parseAI = (text) => {
    setRawText(text);
    const extract = (regex) => (text.match(regex) ? text.match(regex)[1].trim() : '');
    
    setFormData({
      name: extract(/(?:Applicant Name|Student Name|Name|Applicant)\s*[:-]\s*(.*)/i) || formData.name,
      passport: extract(/(?:Passport Number|Passport No|Passport|PP Number|PP)\s*[:-]\s*(.*)/i) || formData.passport,
      institution: extract(/(?:Institution|University|Target University|Target Institution|College)\s*[:-]\s*(.*)/i) || formData.institution,
      intake: extract(/(?:Intake|Session|Intake Session)\s*[:-]\s*(.*)/i) || formData.intake,
      course: extract(/(?:Preferred Course|Course|Program|Programme)\s*[:-]\s*(.*)/i) || formData.course,
      level: extract(/(?:Offer Letter Level|Level|Offer Level)\s*[:-]\s*(.*)/i) || formData.level,
      email: extract(/(?:Email|E-mail|Student Email)\s*[:-]\s*([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i) || formData.email,
      password: extract(/(?:Password|Pass|Portal Password)\s*[:-]\s*(.*)/i) || formData.password,
      contact: extract(/(?:Contact Number|Contact No|Contact|Mobile|Phone)\s*[:-]\s*(.*)/i) || formData.contact
    });
  };

  const openGmail = () => {
    if (!composerContent.subject) {
      showToast('Subject is required to open Gmail', 'error');
      return;
    }
    const to = composerContent.to || '';
    const url = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(to)}&su=${encodeURIComponent(composerContent.subject)}&body=${encodeURIComponent(composerContent.body)}`;
    window.open(url, '_blank');
    incrementStats();
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
      .then(() => showToast('Copied to clipboard'))
      .catch(() => showToast('Failed to copy', 'error'));
  };

  const renderHeader = () => (
    <header className="flex items-center justify-between px-4 py-2 bg-white border-b border-gray-200 sticky top-0 z-40 h-16">
      <div className="flex items-center gap-4">
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2.5 rounded-full hover:bg-gray-100 text-gray-600 transition-colors">
          <Menu size={20} />
        </button>
        <img src="https://insafimmigration.com/build/assets/logo-Ds-gZrzH.png" alt="Logo" className="h-8 object-contain" />
        <span className="text-xl text-gray-600 font-medium hidden sm:block ml-2">Assistant</span>
      </div>
      
      <div className="flex-1 max-w-2xl px-4 hidden md:block">
        <div className="bg-[#f1f3f4] rounded-full flex items-center px-4 py-2.5 focus-within:bg-white focus-within:shadow-[0_1px_1px_rgba(0,0,0,0.1)] focus-within:border focus-within:border-gray-200 border border-transparent transition-all">
          <Search size={20} className="text-gray-500 mr-3" />
          <input type="text" placeholder="Search applications or history..." className="bg-transparent border-none outline-none w-full text-base" />
          <Settings2 size={20} className="text-gray-500 ml-3 cursor-pointer hover:text-gray-700" />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button className="p-2 rounded-full hover:bg-gray-100 text-gray-600" title="Help">
          <HelpCircle size={20} />
        </button>
        <button 
          onClick={() => { if(!isAdminAuth) { setAuthModalOpen(true); } else { setActiveRoute('settings'); } }}
          className={`p-2 rounded-full hover:bg-gray-100 transition-colors ${activeRoute === 'settings' ? 'bg-gray-100 text-blue-600' : 'text-gray-600'}`}
          title="Admin Settings"
        >
          <Settings size={20} />
        </button>
        <button className="p-2 rounded-full hover:bg-gray-100 text-gray-600 mr-2">
          <Grip size={20} />
        </button>
        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-medium cursor-pointer">
          A
        </div>
      </div>
    </header>
  );

  const renderSidebar = () => (
    <aside className={`${isSidebarOpen ? 'w-64' : 'w-0 -translate-x-full lg:w-20 lg:translate-x-0'} transition-all duration-300 bg-white fixed lg:static h-[calc(100vh-64px)] z-30 flex flex-col pt-3 overflow-hidden border-r border-gray-100 group`}>
      <div className="px-2 mb-4">
        <button 
          onClick={() => { setActiveRoute('malta'); setComposerState({...composerState, isOpen: true}); }}
          className="flex items-center gap-4 bg-[#c2e7ff] hover:bg-[#b5e0ff] text-[#001d35] px-5 py-4 rounded-2xl shadow-sm transition-all ml-2"
        >
          <PenSquare size={20} />
          {isSidebarOpen && <span className="font-medium text-sm">Compose</span>}
        </button>
      </div>

      <nav className="flex flex-col pr-4">
        {[
          { id: 'malta', icon: Inbox, label: 'Malta Module' },
          { id: 'malaysia', icon: Folder, label: 'Malaysia Module' },
          { id: 'history', icon: Clock, label: 'Recent Drafts' },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveRoute(item.id)}
            className={`flex items-center gap-4 py-1.5 px-6 rounded-r-full transition-colors ${
              activeRoute === item.id 
                ? 'bg-[#d3e3fd] text-[#0b57d0] font-semibold' 
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <item.icon size={20} className={activeRoute === item.id ? 'text-[#0b57d0]' : 'text-gray-600'} />
            {isSidebarOpen && <span className="text-sm tracking-wide">{item.label}</span>}
          </button>
        ))}

        <div className="my-4 border-t border-gray-200 mr-4 ml-6"></div>
        <div className="px-6 pb-2">
          {isSidebarOpen && <span className="text-xs font-semibold text-gray-500 tracking-wider">WORKSPACE</span>}
        </div>

        <button
          onClick={() => { if(!isAdminAuth) { setAuthModalOpen(true); } else { setActiveRoute('settings'); } }}
          className={`flex items-center gap-4 py-1.5 px-6 rounded-r-full transition-colors ${
            activeRoute === 'settings' 
              ? 'bg-[#d3e3fd] text-[#0b57d0] font-semibold' 
              : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          <Settings size={20} className={activeRoute === 'settings' ? 'text-[#0b57d0]' : 'text-gray-600'} />
          {isSidebarOpen && <span className="text-sm tracking-wide">Admin Settings</span>}
        </button>
      </nav>
      
      {/* Drafts Counter */}
      {isSidebarOpen && (
        <div className="mt-auto mb-6 px-6">
          <div className="bg-[#f6f8fc] rounded-xl p-4 border border-gray-100">
            <div className="text-xs text-gray-500 font-medium mb-1">Activity Today</div>
            <div className="text-2xl font-bold text-[#0b57d0]">{draftsToday}</div>
            <div className="text-xs text-gray-500 mt-1">drafts generated</div>
          </div>
        </div>
      )}
    </aside>
  );

  const renderInputField = (label, id, value, type="text", placeholder, required) => (
    <div className="flex flex-col mb-4">
      <label className="text-xs font-medium text-gray-600 mb-1 ml-1 uppercase tracking-wide">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => setFormData({...formData, [id]: e.target.value})}
        placeholder={placeholder}
        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-shadow bg-white shadow-sm"
      />
    </div>
  );

  const renderMaltaModule = () => (
    <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-full">
      <div className="border-b border-gray-200 px-6 py-3 flex items-center justify-between bg-white z-10">
        <h2 className="text-lg font-medium text-gray-800">Application Data Entry</h2>
        <div className="flex bg-[#f1f3f4] rounded-lg p-0.5">
          <button 
            onClick={() => setInputMode('form')}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${inputMode === 'form' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-600 hover:text-gray-800'}`}
          >
            Structured Form
          </button>
          <button 
            onClick={() => setInputMode('paragraph')}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${inputMode === 'paragraph' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-600 hover:text-gray-800'}`}
          >
            AI Parser
          </button>
        </div>
      </div>

      <div className="p-6 overflow-y-auto flex-1 bg-[#f6f8fc]">
        {inputMode === 'form' ? (
          <div className="bg-white p-6 rounded-xl border border-gray-200 max-w-3xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
              <div className="md:col-span-2">
                {renderInputField("Applicant Name", "name", formData.name, "text", "e.g. Nazmul Huda", true)}
              </div>
              {renderInputField("Passport Number", "passport", formData.passport, "text", "e.g. A11621451", true)}
              {renderInputField("Intake Session", "intake", formData.intake, "text", "e.g. October 2026", false)}
              
              <div className="md:col-span-2 flex flex-col mb-4 relative" ref={dropdownRef}>
                <label className="text-xs font-medium text-gray-600 mb-1 ml-1 uppercase tracking-wide">
                  Target Institution <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.institution}
                    onChange={(e) => {
                      setFormData({...formData, institution: e.target.value});
                      setIsUniDropdownOpen(true);
                    }}
                    onFocus={() => setIsUniDropdownOpen(true)}
                    placeholder="Type or select a mapped university..."
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-sm pr-10"
                  />
                  <div className="absolute right-3 top-2.5 text-gray-400 pointer-events-none">
                    <ChevronDown size={16} />
                  </div>
                </div>
                
                {isUniDropdownOpen && (
                  <div className="absolute z-50 w-full top-[60px] bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-y-auto">
                    {Object.keys(appData.universities)
                      .filter(u => u.toLowerCase().includes((formData.institution || '').toLowerCase()))
                      .map(u => (
                        <div
                          key={u}
                          className="px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 cursor-pointer border-b border-gray-50 last:border-0"
                          onClick={() => {
                            setFormData({...formData, institution: u});
                            setIsUniDropdownOpen(false);
                          }}
                        >
                          {u}
                        </div>
                    ))}
                    {Object.keys(appData.universities).filter(u => u.toLowerCase().includes((formData.institution || '').toLowerCase())).length === 0 && (
                      <div className="px-4 py-2 text-sm text-gray-500 italic bg-gray-50">
                        Press Enter or click outside to use custom institution.
                      </div>
                    )}
                  </div>
                )}
                {formData.institution && (
                  <span className={`text-xs mt-1 ml-1 font-medium ${appData.universities[formData.institution] ? 'text-green-600' : 'text-amber-600'}`}>
                    {appData.universities[formData.institution] ? 'Email mapped successfully' : 'Unmapped university. Recipient will be blank.'}
                  </span>
                )}
              </div>

              {renderInputField("Preferred Course", "course", formData.course, "text", "e.g. BSc Computer Science", false)}
              {renderInputField("Offer Level", "level", formData.level, "text", "e.g. Level 7", false)}
              
              <div className="md:col-span-2 border-t border-gray-100 my-2 pt-4"></div>
              
              {renderInputField("Student Email", "email", formData.email, "email", "student@email.com", true)}
              {renderInputField("Portal Password", "password", formData.password, "text", "Default password", false)}
              <div className="md:col-span-2">
                {renderInputField("Contact Number", "contact", formData.contact, "text", "e.g. 01845887444", false)}
              </div>
            </div>
            
            <div className="mt-6 flex justify-end">
               <button 
                onClick={() => setFormData({name: '', passport: '', intake: '', institution: '', course: '', level: '', contact: '', email: '', password: ''})}
                className="text-gray-500 hover:text-gray-800 text-sm font-medium px-4 py-2"
              >
                Clear Form
              </button>
              <button 
                onClick={() => setComposerState({...composerState, isOpen: true, isMinimized: false})}
                className="bg-[#0b57d0] hover:bg-[#084298] text-white px-6 py-2 rounded-full font-medium text-sm transition-colors"
              >
                Preview Draft
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white p-6 rounded-xl border border-gray-200 max-w-3xl flex flex-col h-[500px]">
             <div className="bg-[#f0f4f9] rounded-lg p-3 mb-4 text-sm text-[#001d35] flex items-start gap-3">
                <Sparkles className="mt-0.5 text-[#0b57d0]" size={18} />
                <p>Paste raw text copied from WhatsApp or documents. The parser will automatically extract recognized fields to build the email.</p>
            </div>
            <textarea
              value={rawText}
              onChange={(e) => parseAI(e.target.value)}
              placeholder="Paste data here...&#10;&#10;Applicant Name: Nazmul Huda&#10;Passport: A11621451&#10;Institution: ECI&#10;Intake: October..."
              className="flex-1 w-full border border-gray-300 rounded-md p-4 text-sm font-mono text-gray-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none shadow-sm"
            />
          </div>
        )}
      </div>
    </div>
  );

  const renderDockedComposer = () => {
    if (!composerState.isOpen) return null;

    const baseClasses = "fixed z-50 bg-white shadow-[0_8px_24px_rgba(0,0,0,0.15)] flex flex-col transition-all duration-200 ease-in-out border border-gray-200";
    
    // Determine positioning based on state
    let stateClasses = "";
    if (composerState.isExpanded) {
      stateClasses = "inset-10 rounded-lg shadow-2xl"; // Full screen mode
    } else if (composerState.isMinimized) {
      stateClasses = "bottom-0 right-4 sm:right-24 w-[300px] h-[48px] rounded-t-xl"; // Minimized
    } else {
      stateClasses = "bottom-0 right-4 sm:right-24 w-[500px] h-[600px] max-h-[80vh] rounded-t-xl"; // Default popup
    }

    // Hide if mobile and not expanded (mobile handles differently)
    if (window.innerWidth < 640 && !composerState.isExpanded && !composerState.isMinimized) {
       stateClasses = "inset-0 w-full h-full";
    }

    const isReady = composerContent.subject && formData.name && formData.passport && formData.institution;

    return (
      <div className={`${baseClasses} ${stateClasses}`}>
        {/* Header */}
        <div 
          className="bg-[#f2f6fc] text-gray-800 px-4 py-2.5 flex justify-between items-center cursor-pointer rounded-t-xl"
          onClick={() => !composerState.isExpanded && setComposerState({...composerState, isMinimized: !composerState.isMinimized})}
        >
          <span className="font-medium text-sm">New Message</span>
          <div className="flex items-center gap-2 text-gray-500" onClick={e => e.stopPropagation()}>
            <button onClick={() => setComposerState({...composerState, isMinimized: !composerState.isMinimized})} className="hover:bg-gray-200 p-1 rounded">
              <Minus size={16} />
            </button>
            <button onClick={() => setComposerState({...composerState, isExpanded: !composerState.isExpanded, isMinimized: false})} className="hover:bg-gray-200 p-1 rounded">
              <Maximize2 size={14} />
            </button>
            <button onClick={() => setComposerState({...composerState, isOpen: false})} className="hover:bg-gray-200 p-1 rounded">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Content (Hidden if minimized) */}
        {!composerState.isMinimized && (
          <>
            <div className="flex-1 flex flex-col overflow-hidden bg-white">
              {/* To Field */}
              <div className="border-b border-gray-100 px-4 py-2 flex items-center group">
                <span className="text-gray-500 text-sm w-12">To</span>
                <input 
                  type="text" 
                  value={composerContent.to}
                  onChange={(e) => setComposerContent({...composerContent, to: e.target.value})}
                  className={`flex-1 outline-none text-sm ${composerContent.to ? 'text-gray-800' : 'text-red-400 placeholder-red-300'}`}
                  placeholder="Recipient not mapped. Add manually..."
                />
                <span className="text-gray-400 text-xs font-medium cursor-pointer hover:underline opacity-0 group-hover:opacity-100">Cc Bcc</span>
              </div>
              
              {/* Subject Field */}
              <div className="border-b border-gray-100 px-4 py-2 flex items-center">
                <input 
                  type="text" 
                  value={composerContent.subject}
                  onChange={(e) => setComposerContent({...composerContent, subject: e.target.value})}
                  className="flex-1 outline-none text-sm font-medium text-gray-800"
                  placeholder="Subject"
                />
              </div>

              {/* Validation Warning inside Composer */}
              {!isReady && (
                <div className="bg-amber-50 px-4 py-2 border-b border-amber-100 flex items-center gap-2 text-xs text-amber-800">
                  <AlertCircle size={14} />
                  Complete the form (Name, Passport, Institution) to generate full draft.
                </div>
              )}

              {/* Body Field */}
              <textarea 
                value={composerContent.body}
                onChange={(e) => setComposerContent({...composerContent, body: e.target.value})}
                className="flex-1 w-full outline-none p-4 text-sm text-gray-800 resize-none font-sans leading-relaxed"
              />
            </div>

            {/* Footer Toolbar */}
            <div className="bg-white border-t border-gray-100 px-4 py-3 flex items-center justify-between rounded-b-xl">
              <div className="flex items-center gap-4">
                <button 
                  onClick={openGmail}
                  disabled={!isReady}
                  className="bg-[#0b57d0] hover:bg-[#084298] disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-6 py-2 rounded-full font-medium text-sm transition-colors shadow-sm"
                >
                  Open in Gmail
                </button>
                
                {/* Formatting Mock Icons */}
                <div className="hidden sm:flex items-center gap-3 text-gray-500">
                  <button className="hover:bg-gray-100 p-1.5 rounded"><span className="font-serif font-bold text-[15px]">A</span></button>
                  <button className="hover:bg-gray-100 p-1.5 rounded"><Paperclip size={18} /></button>
                  <button className="hover:bg-gray-100 p-1.5 rounded"><LinkIcon size={18} /></button>
                  <button className="hover:bg-gray-100 p-1.5 rounded"><Smile size={18} /></button>
                  <button className="hover:bg-gray-100 p-1.5 rounded"><ImageIcon size={18} /></button>
                </div>
              </div>

              <div className="flex items-center gap-2 text-gray-500">
                <button onClick={() => copyToClipboard(`To: ${composerContent.to}\nSubject: ${composerContent.subject}\n\n${composerContent.body}`)} className="hover:bg-gray-100 p-1.5 rounded" title="Copy Text">
                  <Copy size={18} />
                </button>
                <button className="hover:bg-gray-100 p-1.5 rounded" title="Discard draft" onClick={() => setComposerState({...composerState, isOpen: false})}>
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    );
  };

  const renderSettingsModule = () => {
    return (
      <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-full">
        <div className="border-b border-gray-200 px-6 py-4 flex justify-between items-center bg-white">
          <h2 className="text-xl font-medium text-gray-800">Workspace Settings</h2>
          <button onClick={() => setActiveRoute('malta')} className="text-gray-500 hover:text-gray-800"><X size={20}/></button>
        </div>
        
        <div className="flex flex-1 overflow-hidden">
          {/* Settings Sidebar */}
          <div className="w-48 border-r border-gray-100 bg-[#f8f9fa] p-4 flex flex-col gap-1">
            <button onClick={()=>setSettingsTab('universities')} className={`text-left px-4 py-2 rounded-full text-sm font-medium ${settingsTab==='universities'?'bg-[#d3e3fd] text-[#0b57d0]':'text-gray-600 hover:bg-gray-100'}`}>Universities</button>
            <button onClick={()=>setSettingsTab('template')} className={`text-left px-4 py-2 rounded-full text-sm font-medium ${settingsTab==='template'?'bg-[#d3e3fd] text-[#0b57d0]':'text-gray-600 hover:bg-gray-100'}`}>Email Template</button>
            <div className="mt-auto pt-4 border-t border-gray-200">
              <button onClick={() => {
                if(confirm("Reset everything to factory defaults?")) {
                  localStorage.removeItem('insafAppConfig');
                  setAppData({universities: DEFAULT_UNIVERSITIES, template: DEFAULT_TEMPLATE, history: []});
                  showToast('App reset successful');
                }
              }} className="text-left px-4 py-2 rounded-full text-sm font-medium text-red-600 hover:bg-red-50 w-full">Factory Reset</button>
            </div>
          </div>

          {/* Settings Content */}
          <div className="flex-1 p-8 overflow-y-auto bg-white">
            {settingsTab === 'universities' && (
              <div className="max-w-2xl">
                <h3 className="text-lg font-medium mb-4">Email Mappings</h3>
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-[#f8f9fa] border-b border-gray-200">
                      <tr><th className="p-3 font-medium text-gray-600">Institution</th><th className="p-3 font-medium text-gray-600">Recipient Email</th><th className="p-3"></th></tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {Object.entries(appData.universities).map(([name, email]) => (
                        <tr key={name} className="hover:bg-[#f8f9fa]">
                          <td className="p-3 text-gray-800">{name}</td>
                          <td className="p-3 text-gray-600">{email}</td>
                          <td className="p-3 text-right">
                            <button 
                              onClick={() => {
                                const newU = {...appData.universities}; delete newU[name];
                                const newData = {...appData, universities: newU};
                                setAppData(newData); localStorage.setItem('insafAppConfig', JSON.stringify(newData));
                              }}
                              className="text-red-500 hover:bg-red-50 p-1.5 rounded"
                            ><Trash2 size={16}/></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            
            {settingsTab === 'template' && (
              <div className="max-w-2xl flex flex-col h-full">
                 <h3 className="text-lg font-medium mb-2">Default Template</h3>
                 <p className="text-sm text-gray-500 mb-4">Use variables like {'{{name}}'}, {'{{passport}}'}.</p>
                 <textarea 
                    value={appData.template}
                    onChange={(e) => {
                      const newData = {...appData, template: e.target.value};
                      setAppData(newData); localStorage.setItem('insafAppConfig', JSON.stringify(newData));
                    }}
                    className="flex-1 border border-gray-300 rounded-lg p-4 font-mono text-sm resize-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none min-h-[400px]"
                 />
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderHistoryModule = () => (
    <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-full max-w-4xl mx-auto w-full">
      <div className="border-b border-gray-200 px-6 py-4 flex justify-between items-center">
        <h2 className="text-xl font-medium text-gray-800">Recent Applications</h2>
        <button 
          onClick={() => {
             const newData = {...appData, history: []};
             setAppData(newData); localStorage.setItem('insafAppConfig', JSON.stringify(newData));
          }}
          className="text-sm text-red-600 font-medium hover:bg-red-50 px-3 py-1.5 rounded-md transition-colors"
        >Clear History</button>
      </div>
      <div className="overflow-y-auto p-0">
        {appData.history.length === 0 ? (
          <div className="p-12 text-center text-gray-500">No applications drafted yet.</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {appData.history.map(item => (
              <div key={item.id} className="p-4 hover:bg-[#f6f8fc] flex items-center justify-between group cursor-pointer" onClick={() => { setFormData(item.data); setActiveRoute('malta'); setComposerState({...composerState, isOpen: true}); }}>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-[#d3e3fd] text-[#0b57d0] flex items-center justify-center font-bold text-lg">
                    {item.data.name?.charAt(0).toUpperCase() || '?'}
                  </div>
                  <div>
                    <div className="font-medium text-gray-800">{item.data.name || 'Unknown Applicant'}</div>
                    <div className="text-sm text-gray-500">{item.data.institution} • {item.data.passport}</div>
                  </div>
                </div>
                <div className="text-right flex flex-col items-end gap-1">
                   <div className="text-xs text-gray-400">{item.date}</div>
                   <button className="opacity-0 group-hover:opacity-100 text-xs font-medium text-[#0b57d0] bg-[#d3e3fd] px-2 py-1 rounded">Load Draft</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f6f8fc] text-gray-800 font-sans flex flex-col selection:bg-blue-200">
      {renderHeader()}
      
      <div className="flex flex-1 overflow-hidden">
        {renderSidebar()}
        
        {/* Main Workspace Area */}
        <main className="flex-1 overflow-hidden p-2 sm:p-4 lg:p-6 flex justify-center">
          {activeRoute === 'malta' && renderMaltaModule()}
          {activeRoute === 'malaysia' && (
            <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 p-12 flex flex-col items-center justify-center text-center max-w-3xl w-full">
              <Building2 size={48} className="text-gray-300 mb-4" />
              <h2 className="text-2xl font-medium text-gray-800 mb-2">Malaysia Module</h2>
              <p className="text-gray-500 max-w-md">Configuration pending for Hyper Connect and Uni Connect. Please use the Malta workspace for current processing.</p>
            </div>
          )}
          {activeRoute === 'settings' && renderSettingsModule()}
          {activeRoute === 'history' && renderHistoryModule()}
        </main>
      </div>

      {renderDockedComposer()}

      {/* Auth Modal */}
      {authModalOpen && (
        <div className="fixed inset-0 bg-black/40 z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm">
            <h3 className="text-lg font-medium mb-4">Admin Access Required</h3>
            <input 
              type="password" 
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAuth()}
              placeholder="Enter password"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none mb-2"
              autoFocus
            />
            {authError && <p className="text-red-500 text-xs mb-4">{authError}</p>}
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setAuthModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-md">Cancel</button>
              <button onClick={handleAuth} className="px-4 py-2 text-sm font-medium bg-[#0b57d0] text-white hover:bg-[#084298] rounded-md">Login</button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification (Gmail Style) */}
      <div className={`fixed bottom-6 left-6 z-[100] transition-all duration-300 transform ${toast.show ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0 pointer-events-none'}`}>
        <div className="bg-[#323232] text-white px-6 py-3 rounded-md text-sm shadow-lg flex items-center gap-3">
          {toast.message}
        </div>
      </div>
    </div>
  );
}