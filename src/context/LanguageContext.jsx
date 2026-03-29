import { createContext, useContext, useState, useCallback } from 'react';

const UI_STRINGS = {
  en: {
    home: "Home", markets: "Markets", industry: "Industry",
    tech: "Tech", economy: "Economy", wealth: "Wealth",
    startups: "Startups", politics: "Politics", storyArc: "Story Arc",
    newsNavigator: "News Navigator", myET: "My ET",
    search: "Search news...", readMore: "Read More",
    minRead: "min read", relatedStories: "Related Stories",
    aiFeatures: "AI-Powered Features", featureSlots: "Integration slots for each teammate's AI feature",
    readIn: "Read this in", translating: "Translating...",
    culturallyAdapted: "Culturally Adapted", regionalImpact: "Regional Impact",
    glossary: "Key Terms Explained", originalArticle: "Original Article",
    bilingual: "Bilingual View", backToEnglish: "Back to English",
    live: "LIVE", news: "News", investing: "Investing",
    mutualFunds: "Mutual Funds", ipo: "IPO", commodities: "Commodities",
    vernacularEngine: "Vernacular Engine",
    footerDesc: "India's leading financial newspaper. Bringing you the most comprehensive business news, market analysis, and expert opinions — now powered by AI.",
    footerCopy: "© 2026 The Economic Times — ET GenAI Hackathon. Built with ❤️ for the future of news.",
    trackStory: "Track Story", aiBriefing: "AI Briefing",
    loadingNews: "Loading news...", loadingArticle: "Loading article...",
    personalizedNewsroom: "My ET — Personalized Newsroom",
    personalizedDesc: "Your personalized news feed tailored to your interests, portfolio, and professional role.",
    latestNews: "Latest News", marketWatch: "Market Watch", noArticles: "No articles in this category yet.",
  },
  hi: {
    home: "होम", markets: "बाज़ार", industry: "उद्योग",
    tech: "टेक", economy: "अर्थव्यवस्था", wealth: "सम्पत्ति",
    startups: "स्टार्टअप", politics: "राजनीति", storyArc: "स्टोरी आर्क",
    newsNavigator: "न्यूज़ नेविगेटर", myET: "मेरा ET",
    search: "समाचार खोजें...", readMore: "और पढ़ें",
    minRead: "मिनट पढ़ने का समय", relatedStories: "संबंधित खबरें",
    aiFeatures: "AI-संचालित फीचर्स", featureSlots: "हर टीममेट के AI फीचर के लिए इंटीग्रेशन स्लॉट",
    readIn: "इसे पढ़ें", translating: "अनुवाद हो रहा है...",
    culturallyAdapted: "सांस्कृतिक रूप से अनुकूलित", regionalImpact: "क्षेत्रीय प्रभाव",
    glossary: "प्रमुख शब्दों की व्याख्या", originalArticle: "मूल लेख",
    bilingual: "द्विभाषी दृश्य", backToEnglish: "अंग्रेज़ी में वापस",
    live: "लाइव", news: "समाचार", investing: "निवेश",
    mutualFunds: "म्यूचुअल फंड", ipo: "आईपीओ", commodities: "कमोडिटीज़",
    vernacularEngine: "वर्नाक्युलर इंजन",
    footerDesc: "भारत का प्रमुख वित्तीय समाचार पत्र। सबसे व्यापक बिज़नेस न्यूज़, बाज़ार विश्लेषण और विशेषज्ञ राय — अब AI की शक्ति के साथ।",
    footerCopy: "© 2026 द इकोनॉमिक टाइम्स — ET GenAI हैकाथॉन। समाचार के भविष्य के लिए ❤️ से बनाया गया।",
    trackStory: "कहानी ट्रैक करें", aiBriefing: "AI ब्रीफिंग",
    loadingNews: "समाचार लोड हो रहा है...", loadingArticle: "लेख लोड हो रहा है...",
    personalizedNewsroom: "मेरा ET — व्यक्तिगत न्यूज़रूम",
    personalizedDesc: "आपकी रुचियों, पोर्टफोलियो और पेशेवर भूमिका के अनुसार आपकी व्यक्तिगत न्यूज़ फ़ीड।",
    latestNews: "ताज़ा खबरें", marketWatch: "मार्केट वॉच", noArticles: "इस श्रेणी में अभी कोई लेख नहीं है।",
  },
  ta: {
    home: "முகப்பு", markets: "சந்தைகள்", industry: "தொழில்",
    tech: "தொழில்நுட்பம்", economy: "பொருளாதாரம்", wealth: "செல்வம்",
    startups: "ஸ்டார்ட்அப்", politics: "அரசியல்", storyArc: "ஸ்டோரி ஆர்க்",
    newsNavigator: "நியூஸ் நேவிகேட்டர்", myET: "எனது ET",
    search: "செய்திகளைத் தேடுங்கள்...", readMore: "மேலும் படிக்க",
    minRead: "நிமிடம் படிக்க", relatedStories: "தொடர்புடைய செய்திகள்",
    aiFeatures: "AI-இயக்கும் அம்சங்கள்", featureSlots: "ஒவ்வொரு குழு உறுப்பினரின் AI அம்சத்திற்கான ஒருங்கிணைப்பு ஸ்லாட்",
    readIn: "இதைப் படிக்கவும்", translating: "மொழிபெயர்க்கப்படுகிறது...",
    culturallyAdapted: "கலாச்சார ரீதியாக தழுவப்பட்டது", regionalImpact: "பிராந்திய தாக்கம்",
    glossary: "முக்கிய சொற்கள் விளக்கம்", originalArticle: "அசல் கட்டுரை",
    bilingual: "இருமொழி காட்சி", backToEnglish: "ஆங்கிலத்தில் திரும்பு",
    live: "நேரலை", news: "செய்திகள்", investing: "முதலீடு",
    mutualFunds: "மியூச்சுவல் ஃபண்ட்", ipo: "ஐபிஓ", commodities: "பண்டங்கள்",
    vernacularEngine: "வெர்னாக்குலர் இன்ஜின்",
    footerDesc: "இந்தியாவின் முன்னணி நிதி செய்தித்தாள். மிக விரிவான வணிக செய்திகள், சந்தை பகுப்பாய்வு மற்றும் நிபுணர் கருத்துக்கள் — இப்போது AI இன் சக்தியுடன்.",
    footerCopy: "© 2026 தி எகனாமிக் டைம்ஸ் — ET GenAI ஹேக்கத்தான். செய்திகளின் எதிர்காலத்திற்காக ❤️ உடன் உருவாக்கப்பட்டது.",
    trackStory: "கதையை கண்காணிக்கவும்", aiBriefing: "AI பிரீஃபிங்",
    loadingNews: "செய்திகள் ஏற்றப்படுகின்றன...", loadingArticle: "கட்டுரை ஏற்றப்படுகிறது...",
    personalizedNewsroom: "எனது ET — தனிப்பயன் செய்தியறை",
    personalizedDesc: "உங்கள் ஆர்வங்கள், போர்ட்ஃபோலியோ மற்றும் தொழில்முறை பாத்திரத்திற்கு ஏற்ற உங்கள் தனிப்பயன் செய்தி ஊட்டம்.",
    latestNews: "சமீபத்திய செய்திகள்", marketWatch: "மார்க்கெட் வாட்ச்", noArticles: "இந்த பிரிவில் இன்னும் கட்டுரைகள் இல்லை.",
  },
  te: {
    home: "హోమ్", markets: "మార్కెట్లు", industry: "పరిశ్రమ",
    tech: "టెక్", economy: "ఆర్థిక వ్యవస్థ", wealth: "సంపద",
    startups: "స్టార్టప్‌లు", politics: "రాజకీయాలు", storyArc: "స్టోరీ ఆర్క్",
    newsNavigator: "న్యూస్ నావిగేటర్", myET: "నా ET",
    search: "వార్తలు వెతకండి...", readMore: "మరింత చదవండి",
    minRead: "నిమిషాల చదువు", relatedStories: "సంబంధిత కథనాలు",
    aiFeatures: "AI-ఆధారిత ఫీచర్లు", featureSlots: "ప్రతి టీమ్‌మేట్ AI ఫీచర్ కోసం ఇంటిగ్రేషన్ స్లాట్",
    readIn: "దీన్ని చదవండి", translating: "అనువదిస్తోంది...",
    culturallyAdapted: "సాంస్కృతికంగా అనుకూలీకరించబడింది", regionalImpact: "ప్రాంతీయ ప్రభావం",
    glossary: "కీలక పదాల వివరణ", originalArticle: "అసలు వ్యాసం",
    bilingual: "ద్విభాషా వీక్షణ", backToEnglish: "ఆంగ్లంలోకి తిరిగి",
    live: "లైవ్", news: "వార్తలు", investing: "పెట్టుబడి",
    mutualFunds: "మ్యూచువల్ ఫండ్స్", ipo: "ఐపీఓ", commodities: "కమోడిటీస్",
    vernacularEngine: "వెర్నాక్యులర్ ఇంజిన్",
    footerDesc: "భారతదేశపు ప్రముఖ ఆర్థిక వార్తాపత్రిక. అత్యంత సమగ్రమైన వ్యాపార వార్తలు, మార్కెట్ విశ్లేషణ మరియు నిపుణుల అభిప్రాయాలు — ఇప్పుడు AI శక్తితో.",
    footerCopy: "© 2026 ది ఎకనామిక్ టైమ్స్ — ET GenAI హ్యాకథాన్. వార్తల భవిష్యత్తు కోసం ❤️ తో నిర్మించబడింది.",
    trackStory: "కథనాన్ని ట్రాక్ చేయండి", aiBriefing: "AI బ్రీఫింగ్",
    loadingNews: "వార్తలు లోడ్ అవుతున్నాయి...", loadingArticle: "వ్యాసం లోడ్ అవుతోంది...",
    personalizedNewsroom: "నా ET — వ్యక్తిగత న్యూస్‌రూమ్",
    personalizedDesc: "మీ ఆసక్తులు, పోర్ట్‌ఫోలియో మరియు వృత్తిపరమైన పాత్రకు అనుగుణంగా మీ వ్యక్తిగత వార్తా ఫీడ్.",
    latestNews: "తాజా వార్తలు", marketWatch: "మార్కెట్ వాచ్", noArticles: "ఈ విభాగంలో ఇంకా వ్యాసాలు లేవు.",
  },
};

export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', native: 'English', flag: '🇬🇧' },
  { code: 'hi', name: 'Hindi', native: 'हिंदी', flag: '🇮🇳' },
  { code: 'ta', name: 'Tamil', native: 'தமிழ்', flag: '🇮🇳' },
  { code: 'te', name: 'Telugu', native: 'తెలుగు', flag: '🇮🇳' },
];

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState('en');

  const setLanguage = useCallback((lang) => {
    setLanguageState(lang);
    document.documentElement.lang = lang;
  }, []);

  const t = useCallback(
    (key) => {
      return UI_STRINGS[language]?.[key] || UI_STRINGS.en[key] || key;
    },
    [language]
  );

  const isEnglish = language === 'en';

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, isEnglish, SUPPORTED_LANGUAGES }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

export default LanguageContext;
