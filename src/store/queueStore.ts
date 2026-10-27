import { Department, Counter, StaffUser, Patient, Visit, AuditEvent, ClinicalOrder, VisitStatus, PaymentStatus } from '../types';

const STORAGE_KEY = 'smartq_hospital_store_v4';

export const DEPARTMENTS: Department[] = [
  // 1. Internal Medicine & Cardiology
  {
    id: 1,
    name: 'Internal Medicine & Cardiology',
    nameNe: 'इन्टर्नल मेडिसिन तथा मुटु रोग',
    slug: 'internal-medicine',
    prefix: 'MED',
    location: 'Ground Floor · Room 01',
    locationNe: 'भुइँ तल्ला · कोठा नं. ०१ (निलो क्षेत्र)',
    colorZone: 'Blue Zone',
    description: 'General health check-ups, heart disease management, and blood pressure/diabetes care.',
    descriptionNe: 'सामान्य स्वास्थ्य जाँच, मुटु रोग, उच्च रक्तचाप तथा मधुमेह उपचार।',
    category: 'general',
    isOpen: true,
    type: 'opd',
  },
  // 2. General & Laparoscopic Surgery
  {
    id: 2,
    name: 'General & Laparoscopic Surgery',
    nameNe: 'जनरल तथा ल्याप्रोस्कोपिक शल्यक्रिया',
    slug: 'general-surgery',
    prefix: 'SUR',
    location: '1st Floor · Room 02',
    locationNe: 'पहिलो तल्ला · कोठा नं. ०२ (हरियो क्षेत्र)',
    colorZone: 'Green Zone',
    description: 'Surgical consultations, pre- and post-operative care, and minor day-care procedures.',
    descriptionNe: 'शल्यक्रिया परामर्श, शल्यक्रिया अघि र पछिको हेरचाह तथा साना शल्यक्रिया।',
    category: 'surgical',
    isOpen: true,
    type: 'opd',
  },
  // 3. Obstetrics & Gynecology (OB-GYN)
  {
    id: 3,
    name: 'Obstetrics & Gynecology (OB-GYN)',
    nameNe: 'प्रसूति तथा स्त्री रोग सेवा (OB-GYN)',
    slug: 'ob-gyn',
    prefix: 'GYN',
    location: 'Ground Floor · Room 03',
    locationNe: 'भुइँ तल्ला · कोठा नं. ०३ (गुलाबी क्षेत्र)',
    colorZone: 'Pink Zone',
    description: "Prenatal and postnatal care, family planning, and women's health.",
    descriptionNe: 'गर्भावस्था जाँच, प्रसूति सेवा, परिवार नियोजन तथा महिला स्वास्थ्य।',
    category: 'maternal_child',
    isOpen: true,
    type: 'opd',
  },
  // 4. Pediatrics & Child Health
  {
    id: 4,
    name: 'Pediatrics & Child Health',
    nameNe: 'बालरोग तथा शिशु स्वास्थ्य',
    slug: 'pediatrics',
    prefix: 'PED',
    location: 'Ground Floor · Room 05',
    locationNe: 'भुइँ तल्ला · कोठा नं. ०५ (आसमानी क्षेत्र)',
    colorZone: 'Teal Zone',
    description: 'Child healthcare, growth monitoring, and routine immunizations.',
    descriptionNe: 'बालबालिकाको उपचार, शारीरिक वृद्धि अनुगमन तथा नियमित खोप सेवा।',
    category: 'maternal_child',
    isOpen: true,
    type: 'opd',
  },
  // 5. Orthopedics & Trauma Surgery
  {
    id: 5,
    name: 'Orthopedics & Trauma Surgery',
    nameNe: 'हाडजोर्नी, नशा तथा ट्रमा सर्जरी',
    slug: 'orthopedics',
    prefix: 'ORT',
    location: 'Ground Floor · Room 07',
    locationNe: 'भुइँ तल्ला · कोठा नं. ०७ (पहेंलो क्षेत्र)',
    colorZone: 'Amber Zone',
    description: 'Bone, joint, spine, and muscle treatment.',
    descriptionNe: 'हड्डी, जोर्नी, मेरुदण्ड, लिगामेन्ट तथा मांसपेशीको उपचार।',
    category: 'surgical',
    isOpen: true,
    type: 'opd',
  },
  // 6. Ear, Nose, and Throat (ENT - HNS)
  {
    id: 6,
    name: 'Ear, Nose, and Throat (ENT - HNS)',
    nameNe: 'नाक, कान तथा घाँटी रोग (ENT)',
    slug: 'ent',
    prefix: 'ENT',
    location: '1st Floor · Room 08',
    locationNe: 'पहिलो तल्ला · कोठा नं. ०८ (बैजनी क्षेत्र)',
    colorZone: 'Violet Zone',
    description: 'Hearing/speech units and sinus or throat disorders.',
    descriptionNe: 'श्रवण शक्ति, पिनास, टन्सिल तथा घाँटी सम्बन्धी उपचार।',
    category: 'specialty',
    isOpen: true,
    type: 'opd',
  },
  // 7. Dermatology & Venereology
  {
    id: 7,
    name: 'Dermatology & Venereology',
    nameNe: 'छाला, कपाल तथा यौन रोग',
    slug: 'dermatology',
    prefix: 'DER',
    location: '1st Floor · Room 09',
    locationNe: 'पहिलो तल्ला · कोठा नं. ०९ (गुलाबी क्षेत्र)',
    colorZone: 'Rose Zone',
    description: 'Skin, hair, and nail treatments.',
    descriptionNe: 'छालाको एलर्जी, दाग, कपाल झर्ने तथा नङ सम्बन्धी समस्या।',
    category: 'specialty',
    isOpen: true,
    type: 'opd',
  },
  // 8. Psychiatry & Mental Health
  {
    id: 8,
    name: 'Psychiatry & Mental Health',
    nameNe: 'मानसिक स्वास्थ्य तथा मनोपरामर्श',
    slug: 'psychiatry',
    prefix: 'PSY',
    location: '2nd Floor · Room 10',
    locationNe: 'दोस्रो तल्ला · कोठा नं. १० (शान्त क्षेत्र)',
    colorZone: 'Calm Zone',
    description: 'Counseling, behavioral health, and psychiatric consultations.',
    descriptionNe: 'मानसिक स्वास्थ्य, मनोपरामर्श, तनाव तथा अनिद्रा व्यवस्थापन।',
    category: 'specialty',
    isOpen: true,
    type: 'opd',
  },
  // 9. Gastroenterology & Hepatology
  {
    id: 9,
    name: 'Gastroenterology & Hepatology',
    nameNe: 'पेट, आन्द्रा तथा कलेजो रोग',
    slug: 'gastroenterology',
    prefix: 'GAS',
    location: '1st Floor · Room 11',
    locationNe: 'पहिलो तल्ला · कोठा नं. ११ (पन्ना क्षेत्र)',
    colorZone: 'Emerald Zone',
    description: 'Liver, stomach, and digestive tract care.',
    descriptionNe: 'ग्यास्ट्रिक, जण्डिस, कलेजो तथा पाचन प्रणाली सम्बन्धी उपचार।',
    category: 'specialty',
    isOpen: true,
    type: 'opd',
  },
  // 10. Pulmonology & Respiratory Care
  {
    id: 10,
    name: 'Pulmonology & Respiratory Care',
    nameNe: 'छाती, दम तथा श्वासप्रश्वास',
    slug: 'pulmonology',
    prefix: 'PUL',
    location: '1st Floor · Room 13',
    locationNe: 'पहिलो तल्ला · कोठा नं. १३ (नीलो क्षेत्र)',
    colorZone: 'Cyan Zone',
    description: 'Chest, asthma, and sleep-related breathing disorders.',
    descriptionNe: 'खोकी, दम, निमोनिया, क्षयरोग तथा श्वासप्रश्वास हेरचाह।',
    category: 'specialty',
    isOpen: true,
    type: 'opd',
  },
  // 11. Neurology & Neurosurgery
  {
    id: 11,
    name: 'Neurology & Neurosurgery',
    nameNe: 'स्नायु, नशा तथा मस्तिष्क रोग',
    slug: 'neurology',
    prefix: 'NEU',
    location: '2nd Floor · Room 14',
    locationNe: 'दोस्रो तल्ला · कोठा नं. १४ (गाढा नीलो क्षेत्र)',
    colorZone: 'Indigo Zone',
    description: 'Brain, nerve, and spine evaluations.',
    descriptionNe: 'मस्तिष्क, टाउको दुखाइ, पक्षघात, छारे रोग तथा नशा सम्बन्धी जाँच।',
    category: 'specialty',
    isOpen: true,
    type: 'opd',
  },
  // 12. Urology & Nephrology
  {
    id: 12,
    name: 'Urology & Nephrology',
    nameNe: 'मृगौला तथा मूत्ररोग',
    slug: 'urology',
    prefix: 'URO',
    location: '1st Floor · Room 16',
    locationNe: 'पहिलो तल्ला · कोठा नं. १६ (आसमानी क्षेत्र)',
    colorZone: 'Sky Zone',
    description: 'Kidney, bladder, and urinary tract treatments.',
    descriptionNe: 'पत्थरी, प्रोस्टेट, पिसाब सम्बन्धी समस्या तथा मृगौला रोग।',
    category: 'specialty',
    isOpen: true,
    type: 'opd',
  },
  // 13. Dental & Maxillofacial Services
  {
    id: 13,
    name: 'Dental & Maxillofacial Services',
    nameNe: 'दन्तरोग तथा मुख स्वास्थ्य',
    slug: 'dental',
    prefix: 'DEN',
    location: 'Ground Floor · Room 17',
    locationNe: 'भुइँ तल्ला · कोठा नं. १७ (पहेंलो क्षेत्र)',
    colorZone: 'Yellow Zone',
    description: 'Oral health, scaling, extractions, and fillings.',
    descriptionNe: 'दाँत सफा गर्ने, निकाल्ने, भर्ने, आरसीटी तथा मुख स्वास्थ्य।',
    category: 'specialty',
    isOpen: true,
    type: 'opd',
  },
  // 14. Ophthalmology (Eye Care)
  {
    id: 14,
    name: 'Ophthalmology (Eye Care)',
    nameNe: 'आँखा जाँच तथा उपचार',
    slug: 'ophthalmology',
    prefix: 'EYE',
    location: 'Ground Floor · Room 18',
    locationNe: 'भुइँ तल्ला · कोठा नं. १८ (जैतुन क्षेत्र)',
    colorZone: 'Olive Zone',
    description: 'Vision tests and eye condition check-ups.',
    descriptionNe: 'दृष्टि परीक्षण, मोतियाबिन्दु, चश्मा जाँच तथा आँखाका रोगहरू।',
    category: 'specialty',
    isOpen: true,
    type: 'opd',
  },

  // Core Diagnostic & Support Units
  // 15. Pathology Laboratory
  {
    id: 15,
    name: 'Pathology Laboratory',
    nameNe: 'प्याथोलोजी प्रयोगशाला (रगत/पिसाब जाँच)',
    slug: 'lab',
    prefix: 'LAB',
    location: '1st Floor · Room 12',
    locationNe: 'पहिलो तल्ला · कोठा नं. १२ (पहेँलो क्षेत्र)',
    colorZone: 'Yellow Zone',
    description: 'Diagnostic blood, urine, biochemistry, and pathology specimen testing.',
    descriptionNe: 'रगत, पिसाब, बायोकेमेस्ट्री तथा प्याथोलोजी नमुना परीक्षण।',
    category: 'diagnostics',
    isOpen: true,
    type: 'lab',
  },
  // 16. Radiology & Imaging
  {
    id: 16,
    name: 'Radiology & X-Ray',
    nameNe: 'रेडियोलोजी (एक्स-रे तथा भिडियो एक्स-रे)',
    slug: 'radiology',
    prefix: 'RAD',
    location: '1st Floor · Room 15',
    locationNe: 'पहिलो तल्ला · कोठा नं. १५ (सुन्तला क्षेत्र)',
    colorZone: 'Orange Zone',
    description: 'Digital X-Rays, Ultrasound (USG), and diagnostic imaging scans.',
    descriptionNe: 'डिजिटल एक्स-रे, भिडियो एक्स-रे तथा इमेजिङ परीक्षण।',
    category: 'diagnostics',
    isOpen: true,
    type: 'radiology',
  },
  // 17. Billing & Bima Counter
  {
    id: 17,
    name: 'Billing & Bima',
    nameNe: 'बिलिङ तथा स्वास्थ्य बीमा काउन्टर',
    slug: 'billing',
    prefix: 'BIL',
    location: 'Ground Floor · Counter 02',
    locationNe: 'भुइँ तल्ला · काउन्टर नं. ०२ (हरियो क्षेत्र)',
    colorZone: 'Green Zone',
    description: 'Cash payments, government health insurance (Bima), and social exemption verification.',
    descriptionNe: 'नगद भुक्तानी, राष्ट्रिय स्वास्थ्य बीमा तथा विपन्न नागरिक छुट प्रमाणीकरण।',
    category: 'support',
    isOpen: true,
    type: 'billing',
  },
  // 18. Hospital Pharmacy
  {
    id: 18,
    name: 'Hospital Pharmacy',
    nameNe: 'अस्पताल फार्मेसी (औषधि वितरण)',
    slug: 'pharmacy',
    prefix: 'PHR',
    location: 'Exit Lobby · Counter 05',
    locationNe: 'निकास द्वार · काउन्टर नं. ०५ (बैजनी क्षेत्र)',
    colorZone: 'Purple Zone',
    description: 'Prescription dispensing, dosage counseling, and medication fulfillment.',
    descriptionNe: 'चिकित्सकीय औषधि वितरण तथा सेवन परामर्श सेवा।',
    category: 'support',
    isOpen: true,
    type: 'pharmacy',
  },
];

export const COUNTERS: Counter[] = [
  // Medicine
  { id: 1, departmentId: 1, name: 'Doctor Room 01 (Desk A)', nameNe: 'डाक्टर कोठा ०१ (डेस्क क)', isOpen: true },
  { id: 2, departmentId: 1, name: 'Doctor Room 01 (Desk B)', nameNe: 'डाक्टर कोठा ०१ (डेस्क ख)', isOpen: true },
  // Surgery
  { id: 3, departmentId: 2, name: 'Surgery OPD Room 02', nameNe: 'शल्यक्रिया कोठा ०२', isOpen: true },
  // OB-GYN
  { id: 4, departmentId: 3, name: 'OB-GYN Room 03', nameNe: 'प्रसूति कोठा ०३', isOpen: true },
  // Pediatrics
  { id: 5, departmentId: 4, name: 'Pediatrics Room 05', nameNe: 'बालरोग कोठा ०५', isOpen: true },
  // Orthopedics
  { id: 6, departmentId: 5, name: 'Orthopedics Room 07', nameNe: 'हाडजोर्नी कोठा ०७', isOpen: true },
  // ENT
  { id: 7, departmentId: 6, name: 'ENT Room 08', nameNe: 'नाक, कान, घाँटी कोठा ०८', isOpen: true },
  // Dermatology
  { id: 8, departmentId: 7, name: 'Dermatology Room 09', nameNe: 'छाला रोग कोठा ०९', isOpen: true },
  // Psychiatry
  { id: 9, departmentId: 8, name: 'Psychiatry Room 10', nameNe: 'मानसिक स्वास्थ्य कोठा १०', isOpen: true },
  // Gastroenterology
  { id: 10, departmentId: 9, name: 'Gastro Room 11', nameNe: 'पेट तथा कलेजो कोठा ११', isOpen: true },
  // Pulmonology
  { id: 11, departmentId: 10, name: 'Chest Clinic Room 13', nameNe: 'छाती तथा दम क्लिनिक १३', isOpen: true },
  // Neurology
  { id: 12, departmentId: 11, name: 'Neurology Room 14', nameNe: 'स्नायु तथा नशा कोठा १४', isOpen: true },
  // Urology
  { id: 13, departmentId: 12, name: 'Urology Room 16', nameNe: 'मूत्ररोग कोठा १६', isOpen: true },
  // Dental
  { id: 14, departmentId: 13, name: 'Dental Chair 1 (Room 17)', nameNe: 'दन्त कुर्सी १ (कोठा १७)', isOpen: true },
  // Eye
  { id: 15, departmentId: 14, name: 'Eye Testing Room 18', nameNe: 'आँखा जाँच कोठा १८', isOpen: true },
  // Support & Diagnostics
  { id: 16, departmentId: 15, name: 'Phlebotomy Chair 1', nameNe: 'रगत संकलन १', isOpen: true },
  { id: 17, departmentId: 15, name: 'Phlebotomy Chair 2', nameNe: 'रगत संकलन २', isOpen: true },
  { id: 18, departmentId: 16, name: 'Digital X-Ray Unit', nameNe: 'डिजिटल एक्स-रे १', isOpen: true },
  { id: 19, departmentId: 17, name: 'Billing Cashier 1', nameNe: 'नगद काउन्टर १', isOpen: true },
  { id: 20, departmentId: 17, name: 'Bima Insurance Desk', nameNe: 'स्वास्थ्य बीमा डेस्क २', isOpen: true },
  { id: 21, departmentId: 18, name: 'Pharmacy Window 1', nameNe: 'फार्मेसी झ्याल १', isOpen: true },
];

export const STAFF_USERS: StaffUser[] = [
  { username: 'reception', fullName: 'Suman Shrestha (Receptionist)', role: 'reception', departmentId: null },
  { username: 'doctor', fullName: 'Dr. Ramesh Acharya (MD Internal Medicine & Cardiology)', role: 'doctor', departmentId: 1 },
  { username: 'doctor_surg', fullName: 'Dr. Sandeep Sharma (MS General Surgery)', role: 'doctor', departmentId: 2 },
  { username: 'doctor_gyn', fullName: 'Dr. Pratima Karki (MD OB-GYN)', role: 'doctor', departmentId: 3 },
  { username: 'doctor_ped', fullName: 'Dr. Anup Regmi (MD Pediatrics)', role: 'doctor', departmentId: 4 },
  { username: 'doctor_ortho', fullName: 'Dr. Prakash Thapa (MS Orthopedics)', role: 'doctor', departmentId: 5 },
  { username: 'doctor_ent', fullName: 'Dr. Sujan Shrestha (MS ENT-HNS)', role: 'doctor', departmentId: 6 },
  { username: 'doctor_derm', fullName: 'Dr. Priya Joshi (MD Dermatology)', role: 'doctor', departmentId: 7 },
  { username: 'doctor_eye', fullName: 'Dr. Sunil Chaudhary (MD Ophthalmology)', role: 'doctor', departmentId: 14 },
  { username: 'cashier', fullName: 'Gita Thapa (Cashier & Bima)', role: 'cashier', departmentId: 17 },
  { username: 'lab', fullName: 'Nabin Karki (Lab Technologist)', role: 'lab', departmentId: 15 },
  { username: 'radiology', fullName: 'Pradeep Gautam (Radiographer)', role: 'radiology', departmentId: 16 },
  { username: 'pharmacy', fullName: 'Laxmi Joshi (Pharmacist)', role: 'pharmacy', departmentId: 18 },
  { username: 'admin', fullName: 'Medical Superintendent (Director)', role: 'admin', departmentId: null },
  { username: 'patient', fullName: 'Patient Portal / Public Kiosk', role: 'patient', departmentId: null },
];

export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function getTodayDateString(): string {
  return new Date().toISOString().split('T')[0];
}

export interface StoreState {
  departments: Department[];
  counters: Counter[];
  patients: Patient[];
  visits: Visit[];
  auditEvents: AuditEvent[];
  currentUser: StaffUser;
}

export function buildInitialState(): StoreState {
  const today = getTodayDateString();
  const now = new Date();

  const patientsList: Patient[] = [
    { id: generateUUID(), name: 'Maya Tamang', hospitalId: 'DEMO-001', bimaNumber: 'BIMA-98214', age: 34, gender: 'Female', phone: '9841234560', createdAt: new Date(now.getTime() - 90 * 60000).toISOString() },
    { id: generateUUID(), name: 'Ram Bahadur Shrestha', hospitalId: 'DEMO-002', bimaNumber: 'BIMA-12044', age: 72, gender: 'Male', isSenior: true, phone: '9841234561', createdAt: new Date(now.getTime() - 80 * 60000).toISOString() },
    { id: generateUUID(), name: 'Sita Devi Sharma', hospitalId: 'DEMO-003', age: 27, gender: 'Female', isPregnant: true, phone: '9841234562', createdAt: new Date(now.getTime() - 70 * 60000).toISOString() },
    { id: generateUUID(), name: 'Hari Prasad Bhatta', hospitalId: 'DEMO-004', age: 68, gender: 'Male', isSenior: true, hasDisability: true, phone: '9841234563', createdAt: new Date(now.getTime() - 60 * 60000).toISOString() },
    { id: generateUUID(), name: 'Bishnu Maya Gurung', hospitalId: 'DEMO-005', age: 51, gender: 'Female', phone: '9841234564', createdAt: new Date(now.getTime() - 50 * 60000).toISOString() },
    { id: generateUUID(), name: 'Bikash Chaudhary', hospitalId: 'DEMO-006', bimaNumber: 'BIMA-45112', age: 46, gender: 'Male', phone: '9841234565', createdAt: new Date(now.getTime() - 40 * 60000).toISOString() },
    { id: generateUUID(), name: 'Aarav Shrestha (Child)', hospitalId: 'DEMO-007', age: 4, gender: 'Male', phone: '9841234566', createdAt: new Date(now.getTime() - 35 * 60000).toISOString() },
    { id: generateUUID(), name: 'Kiran Thapa', hospitalId: 'DEMO-008', age: 23, gender: 'Male', phone: '9841234567', createdAt: new Date(now.getTime() - 30 * 60000).toISOString() },
    { id: generateUUID(), name: 'Anita KC', hospitalId: 'DEMO-009', bimaNumber: 'BIMA-33910', age: 39, gender: 'Female', phone: '9841234568', createdAt: new Date(now.getTime() - 25 * 60000).toISOString() },
  ];

  const visitsList: Visit[] = [];
  const eventsList: AuditEvent[] = [];

  // Visit 1: Maya Tamang - Internal Medicine & Cardiology (Has Lab and X-Ray tests ordered)
  const v1Id = generateUUID();
  visitsList.push({
    id: v1Id,
    requestKey: generateUUID(),
    patientId: patientsList[0].id,
    patient: patientsList[0],
    departmentId: 16, // Currently at Radiology
    department: DEPARTMENTS[15],
    counterId: null,
    counter: null,
    date: today,
    token: 'MED-041',
    pinCode: '3819',
    status: 'waiting',
    subQueue: 'walkin',
    orders: [
      {
        id: generateUUID(),
        category: 'lab',
        testCode: 'CBC',
        testNameEn: 'Complete Blood Count (CBC)',
        testNameNe: 'पूर्ण रगत गणना (CBC)',
        isPaid: true,
        paymentStatus: 'bima_verified',
        receiptNumber: 'BIMA-8812',
        specimenStatus: 'collected',
        isReportReady: false,
        createdAt: new Date(now.getTime() - 60 * 60000).toISOString(),
      },
      {
        id: generateUUID(),
        category: 'radiology',
        testCode: 'CXR',
        testNameEn: 'Chest X-Ray PA View',
        testNameNe: 'छातीको एक्स-रे',
        isPaid: true,
        paymentStatus: 'bima_verified',
        receiptNumber: 'BIMA-8812',
        specimenStatus: 'pending',
        isReportReady: false,
        createdAt: new Date(now.getTime() - 60 * 60000).toISOString(),
      },
    ],
    prescriptionNotes: 'Amlodipine 5mg OD, Atorvastatin 10mg HS',
    createdAt: new Date(now.getTime() - 75 * 60000).toISOString(),
    queuedAt: new Date(now.getTime() - 30 * 60000).toISOString(),
    version: 3,
  });
  eventsList.push(
    { id: generateUUID(), actor: 'reception', visitId: v1Id, visitToken: 'MED-041', action: 'Registered', createdAt: new Date(now.getTime() - 75 * 60000).toISOString() },
    { id: generateUUID(), actor: 'doctor', visitId: v1Id, visitToken: 'MED-041', action: 'Consultation Complete · Ordered Tests', reason: 'CBC + Chest X-Ray', createdAt: new Date(now.getTime() - 55 * 60000).toISOString() },
    { id: generateUUID(), actor: 'cashier', visitId: v1Id, visitToken: 'MED-041', action: 'Bima Verified', reason: 'Receipt #BIMA-8812', createdAt: new Date(now.getTime() - 45 * 60000).toISOString() },
    { id: generateUUID(), actor: 'lab', visitId: v1Id, visitToken: 'MED-041', action: 'Blood Sample Collected', reason: 'Vacutainer EDTA', createdAt: new Date(now.getTime() - 35 * 60000).toISOString() }
  );

  // Visit 2: Bikash Chaudhary - Gastroenterology & Hepatology (Report ready, in Doctor Review queue!)
  const v2Id = generateUUID();
  visitsList.push({
    id: v2Id,
    requestKey: generateUUID(),
    patientId: patientsList[5].id,
    patient: patientsList[5],
    departmentId: 9, // Gastroenterology
    department: DEPARTMENTS[8],
    counterId: null,
    counter: null,
    date: today,
    token: 'GAS-012',
    pinCode: '4921',
    status: 'waiting',
    subQueue: 'review',
    orders: [
      {
        id: generateUUID(),
        category: 'lab',
        testCode: 'LFT',
        testNameEn: 'Liver Function Test (LFT) + Ultrasound Abdomen',
        testNameNe: 'कलेजो परीक्षण (LFT) तथा भिडियो एक्स-रे',
        isPaid: true,
        paymentStatus: 'cash_paid',
        receiptNumber: 'RCP-9941',
        specimenStatus: 'ready',
        isReportReady: true,
        createdAt: new Date(now.getTime() - 90 * 60000).toISOString(),
        completedAt: new Date(now.getTime() - 15 * 60000).toISOString(),
      },
    ],
    createdAt: new Date(now.getTime() - 85 * 60000).toISOString(),
    queuedAt: new Date(now.getTime() - 15 * 60000).toISOString(),
    version: 4,
  });

  // Visit 3: Sita Devi Sharma - OB-GYN Room 03 (Pregnant woman, in service)
  const v3Id = generateUUID();
  visitsList.push({
    id: v3Id,
    requestKey: generateUUID(),
    patientId: patientsList[2].id,
    patient: patientsList[2],
    departmentId: 3, // OB-GYN
    department: DEPARTMENTS[2],
    counterId: 4,
    counter: COUNTERS[3],
    date: today,
    token: 'GYN-008',
    pinCode: '5812',
    status: 'in_service',
    subQueue: 'walkin',
    orders: [],
    createdAt: new Date(now.getTime() - 40 * 60000).toISOString(),
    queuedAt: new Date(now.getTime() - 40 * 60000).toISOString(),
    calledAt: new Date(now.getTime() - 8 * 60000).toISOString(),
    startedAt: new Date(now.getTime() - 7 * 60000).toISOString(),
    version: 2,
  });

  // Visit 4: Aarav Shrestha - Pediatrics & Child Health (Routine Immunization & Growth Check)
  const v4Id = generateUUID();
  visitsList.push({
    id: v4Id,
    requestKey: generateUUID(),
    patientId: patientsList[6].id,
    patient: patientsList[6],
    departmentId: 4, // Pediatrics
    department: DEPARTMENTS[3],
    counterId: null,
    counter: null,
    date: today,
    token: 'PED-015',
    pinCode: '9124',
    status: 'waiting',
    subQueue: 'walkin',
    orders: [],
    createdAt: new Date(now.getTime() - 30 * 60000).toISOString(),
    queuedAt: new Date(now.getTime() - 30 * 60000).toISOString(),
    version: 0,
  });

  // Visit 5: Hari Prasad Bhatta - Orthopedics & Trauma Surgery (Disabled & Senior Citizen Priority)
  const v5Id = generateUUID();
  visitsList.push({
    id: v5Id,
    requestKey: generateUUID(),
    patientId: patientsList[3].id,
    patient: patientsList[3],
    departmentId: 5, // Orthopedics
    department: DEPARTMENTS[4],
    counterId: null,
    counter: null,
    date: today,
    token: 'ORT-022',
    pinCode: '1904',
    status: 'waiting',
    subQueue: 'urgent',
    orders: [],
    createdAt: new Date(now.getTime() - 20 * 60000).toISOString(),
    queuedAt: new Date(now.getTime() - 20 * 60000).toISOString(),
    version: 0,
  });

  // Visit 6: Anita KC - Ophthalmology (Eye Care - Vision test)
  const v6Id = generateUUID();
  visitsList.push({
    id: v6Id,
    requestKey: generateUUID(),
    patientId: patientsList[8].id,
    patient: patientsList[8],
    departmentId: 14, // Ophthalmology
    department: DEPARTMENTS[13],
    counterId: null,
    counter: null,
    date: today,
    token: 'EYE-005',
    pinCode: '6402',
    status: 'waiting',
    subQueue: 'walkin',
    orders: [],
    createdAt: new Date(now.getTime() - 15 * 60000).toISOString(),
    queuedAt: new Date(now.getTime() - 15 * 60000).toISOString(),
    version: 0,
  });

  // Visit 7: Kiran Thapa - General & Laparoscopic Surgery (Emergency acute surgical case)
  const v7Id = generateUUID();
  visitsList.push({
    id: v7Id,
    requestKey: generateUUID(),
    patientId: patientsList[7].id,
    patient: patientsList[7],
    departmentId: 2, // Surgery
    department: DEPARTMENTS[1],
    counterId: null,
    counter: null,
    date: today,
    token: 'SUR-004',
    pinCode: '7721',
    status: 'waiting',
    subQueue: 'urgent',
    isClinicalEmergency: true,
    orders: [],
    createdAt: new Date(now.getTime() - 10 * 60000).toISOString(),
    queuedAt: new Date(now.getTime() - 10 * 60000).toISOString(),
    version: 0,
  });
  eventsList.push({
    id: generateUUID(),
    actor: 'reception',
    visitId: v7Id,
    visitToken: 'SUR-004',
    action: 'Registered (Emergency / आकस्मिक)',
    reason: 'General & Laparoscopic Surgery',
    createdAt: new Date(now.getTime() - 10 * 60000).toISOString(),
  });

  return {
    departments: DEPARTMENTS,
    counters: COUNTERS,
    patients: patientsList,
    visits: visitsList,
    auditEvents: eventsList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    currentUser: STAFF_USERS[0],
  };
}

export function loadStore(): StoreState {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.departments) && parsed.departments.length >= 14 && Array.isArray(parsed.visits)) {
          return parsed;
        }
      }
    }
  } catch (err) {
    console.error('Failed to parse storage, reloading initial seed', err);
  }
  const fresh = buildInitialState();
  saveStore(fresh);
  return fresh;
}

let syncTimeout: any = null;

export function saveStore(state: StoreState): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
  } catch (err) {
    console.error('Failed to persist state locally', err);
  }

  // Debounced asynchronous persistence to SQLite backend server
  if (typeof window !== 'undefined' && typeof fetch === 'function') {
    if (syncTimeout) clearTimeout(syncTimeout);
    syncTimeout = setTimeout(() => {
      fetch('/api/state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(state),
      }).catch((err) => {
        // Dev or offline fallback: silent catch
        console.warn('Backend SQLite sync warning:', err.message);
      });
    }, 300);
  }
}

export async function fetchServerState(): Promise<StoreState | null> {
  try {
    const res = await fetch('/api/state');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (data && Array.isArray(data.visits) && Array.isArray(data.departments)) {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      }
      return data as StoreState;
    }
  } catch (err) {
    // Backend offline or compiling
    console.debug('Could not fetch server state:', err);
  }
  return null;
}

export async function checkDatabaseHealth(): Promise<{ connected: boolean; details?: any }> {
  try {
    const res = await fetch('/api/health');
    if (res.ok) {
      const data = await res.json();
      return { connected: true, details: data.database };
    }
  } catch (e) {
    // fallback
  }
  return { connected: false };
}

export async function authenticatePatientOnline(token: string, pinCode: string): Promise<Visit | null> {
  try {
    const res = await fetch('/api/auth/patient', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, pinCode }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.visit) return data.visit;
    }
  } catch (e) {
    console.debug('Online patient auth failed, falling back to local store check', e);
  }
  return null;
}

export function resetToDemo(): StoreState {
  const fresh = buildInitialState();
  saveStore(fresh);
  if (typeof window !== 'undefined' && typeof fetch === 'function') {
    fetch('/api/reset-demo', { method: 'POST' }).catch(() => {});
  }
  return fresh;
}
