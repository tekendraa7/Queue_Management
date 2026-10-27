import React, { useState, useEffect, useMemo } from 'react';
import {
  Department,
  Counter,
  StaffUser,
  StaffRole,
  Patient,
  Visit,
  AuditEvent,
  ClinicalOrder,
  VisitStatus,
  PaymentStatus,
} from './types';
import {
  loadStore,
  saveStore,
  resetToDemo,
  STAFF_USERS,
  generateUUID,
  getTodayDateString,
  fetchServerState,
  checkDatabaseHealth,
} from './store/queueStore';
import { TRANSLATIONS, Language } from './i18n';
import { PatientDashboard } from './components/PatientDashboard';

export function App() {
  const [store, setStore] = useState(() => loadStore());
  const [dbConnected, setDbConnected] = useState<boolean>(true);
  const [dbStats, setDbStats] = useState<any>(null);
  const [lang, setLang] = useState<Language>('en');
  const [activeRole, setActiveRole] = useState<StaffRole>('reception');
  const [selectedDoctorDeptId, setSelectedDoctorDeptId] = useState<number>(1); // Active doctor room
  const [overviewCategory, setOverviewCategory] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<
    'overview' | 'register' | 'doctorDesk' | 'labDesk' | 'radiologyDesk' | 'billingDesk' | 'pharmacyDesk' | 'adminKpis' | 'patientView' | 'ticket' | 'display' | 'activity'
  >('overview');

  const [selectedVisitId, setSelectedVisitId] = useState<string | null>(null);
  const [patientLookupToken, setPatientLookupToken] = useState<string>('MED-041');
  const [notice, setNotice] = useState<{ type: 'success' | 'error' | 'warning'; message: string } | null>(null);

  const t = TRANSLATIONS[lang];

  useEffect(() => {
    if (notice) {
      const timer = setTimeout(() => setNotice(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [notice]);

  useEffect(() => {
    saveStore(store);
  }, [store]);

  // Synchronize state with SQLite database and poll for cross-device updates
  useEffect(() => {
    let isMounted = true;

    // Initial fetch from SQLite database
    fetchServerState().then((serverData) => {
      if (isMounted && serverData) {
        setStore(serverData);
      }
    });

    checkDatabaseHealth().then((health) => {
      if (isMounted) {
        setDbConnected(health.connected);
        if (health.details) setDbStats(health.details);
      }
    });

    const interval = setInterval(() => {
      fetchServerState().then((serverData) => {
        if (!isMounted || !serverData) return;
        setStore((prev) => {
          // Detect changes across other devices (patient count, audit logs, statuses)
          const prevSig = prev.visits.map((v) => `${v.id}:${v.status}:${v.subQueue}:${v.orders.length}`).join('|');
          const serverSig = serverData.visits.map((v) => `${v.id}:${v.status}:${v.subQueue}:${v.orders.length}`).join('|');
          if (prevSig !== serverSig || prev.auditEvents.length !== serverData.auditEvents.length) {
            return serverData;
          }
          return prev;
        });
      });

      checkDatabaseHealth().then((health) => {
        if (isMounted) {
          setDbConnected(health.connected);
          if (health.details) setDbStats(health.details);
        }
      });
    }, 3500);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const showNotice = (type: 'success' | 'error' | 'warning', message: string) => {
    setNotice({ type, message });
  };

  const todayStr = getTodayDateString();
  const todayVisits = useMemo(() => {
    return store.visits.filter((v) => v.date === todayStr);
  }, [store.visits, todayStr]);

  const waitingCount = useMemo(() => todayVisits.filter((v) => v.status === 'waiting').length, [todayVisits]);
  const servingCount = useMemo(() => todayVisits.filter((v) => v.status === 'called' || v.status === 'in_service').length, [todayVisits]);
  const completedCount = useMemo(() => todayVisits.filter((v) => v.status === 'completed').length, [todayVisits]);

  const patientVisit = useMemo(() => {
    if (selectedVisitId) {
      return store.visits.find((v) => v.id === selectedVisitId) || store.visits[0];
    }
    const match = store.visits.find(
      (v) => v.token.toLowerCase() === patientLookupToken.trim().toLowerCase()
    );
    return match || store.visits[0];
  }, [store.visits, selectedVisitId, patientLookupToken]);

  const currentUser = useMemo(() => {
    return STAFF_USERS.find((u) => u.role === activeRole) || STAFF_USERS[0];
  }, [activeRole]);

  const getStatusText = (status: VisitStatus) => {
    return t.status[status] || status;
  };

  const getWaitMinutes = (queuedAtStr: string) => {
    const qTime = new Date(queuedAtStr).getTime();
    return Math.max(0, Math.floor((Date.now() - qTime) / 60000));
  };

  const handleRoleChange = (role: StaffRole) => {
    setActiveRole(role);
    if (role === 'patient') {
      setActiveTab('patientView');
    } else if (role === 'doctor') {
      setActiveTab('doctorDesk');
    } else if (role === 'lab') {
      setActiveTab('labDesk');
    } else if (role === 'radiology') {
      setActiveTab('radiologyDesk');
    } else if (role === 'cashier') {
      setActiveTab('billingDesk');
    } else if (role === 'pharmacy') {
      setActiveTab('pharmacyDesk');
    } else if (role === 'admin') {
      setActiveTab('adminKpis');
    } else {
      setActiveTab('overview');
    }
    showNotice('success', `${t.role}: ${t.roles[role]}`);
  };

  const speakAnnouncement = (token: string, roomName: string) => {
    try {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const text =
          lang === 'ne'
            ? `टोकन नम्बर ${token}, ${roomName} मा आउनुहोस्`
            : `Token Number ${token}, please proceed to ${roomName}`;
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.9;
        utterance.lang = lang === 'ne' ? 'ne-NP' : 'en-US';
        window.speechSynthesis.speak(utterance);
      }
    } catch {
      // Audio fallback silent
    }
  };

  // Helper getters for departments
  const labDept = useMemo(() => store.departments.find((d) => d.type === 'lab') || store.departments[14], [store.departments]);
  const radDept = useMemo(() => store.departments.find((d) => d.type === 'radiology') || store.departments[15], [store.departments]);
  const billDept = useMemo(() => store.departments.find((d) => d.type === 'billing') || store.departments[16], [store.departments]);
  const phrDept = useMemo(() => store.departments.find((d) => d.type === 'pharmacy') || store.departments[17], [store.departments]);

  const handleRegisterVisit = (payload: {
    existingPatientId?: string | null;
    name: string;
    hospitalId: string;
    bimaNumber: string;
    age: string;
    gender: string;
    phone: string;
    departmentId: number;
    isSenior: boolean;
    hasDisability: boolean;
    isPregnant: boolean;
    isEmergency?: boolean;
    confirmed: boolean;
  }) => {
    const dept = store.departments.find((d) => d.id === payload.departmentId);
    if (!dept || !dept.isOpen) {
      showNotice('error', lang === 'ne' ? 'यो विभाग हाल बन्द छ।' : 'This department is closed.');
      return;
    }

    let targetPatient: Patient;
    const existing = payload.existingPatientId
      ? store.patients.find((p) => p.id === payload.existingPatientId)
      : null;

    if (existing) {
      targetPatient = existing;
    } else {
      const cleanName = payload.name.trim();
      if (!cleanName) {
        showNotice('error', lang === 'ne' ? 'कृपया बिरामीको नाम लेख्नुहोस्।' : 'Enter a patient full name.');
        return;
      }
      targetPatient = {
        id: generateUUID(),
        name: cleanName,
        hospitalId: payload.hospitalId.trim() || `HOSP-${Math.floor(100 + Math.random() * 900)}`,
        bimaNumber: payload.bimaNumber.trim() || null,
        age: payload.age ? parseInt(payload.age, 10) : null,
        gender: payload.gender || 'Other',
        phone: payload.phone.trim() || undefined,
        isSenior: payload.isSenior,
        hasDisability: payload.hasDisability,
        isPregnant: payload.isPregnant,
        createdAt: new Date().toISOString(),
      };
    }

    const deptVisits = store.visits.filter((v) => v.departmentId === dept.id && v.date === todayStr);
    const tokenStr = `${dept.prefix}-${String(deptVisits.length + 1).padStart(3, '0')}`;
    const newVisitId = generateUUID();
    const nowIso = new Date().toISOString();

    const isUrgent = payload.isEmergency || payload.isSenior || payload.hasDisability;

    const newVisit: Visit = {
      id: newVisitId,
      requestKey: generateUUID(),
      patientId: targetPatient.id,
      patient: targetPatient,
      departmentId: dept.id,
      department: dept,
      counterId: null,
      counter: null,
      date: todayStr,
      token: tokenStr,
      pinCode: String(Math.floor(1000 + Math.random() * 9000)),
      status: 'waiting',
      subQueue: isUrgent ? 'urgent' : 'walkin',
      isClinicalEmergency: !!payload.isEmergency,
      orders: [],
      createdAt: nowIso,
      queuedAt: nowIso,
      version: 0,
    };

    const audit: AuditEvent = {
      id: generateUUID(),
      actor: currentUser.fullName,
      visitId: newVisitId,
      visitToken: tokenStr,
      action: payload.isEmergency 
        ? 'Registered (Emergency / आकस्मिक)' 
        : payload.hasDisability 
        ? 'Registered (Disabled / अपाङ्गता प्राथमिकता)' 
        : 'Registered / दर्ता सम्पन्न',
      reason: dept.name,
      createdAt: nowIso,
    };

    setStore((prev) => ({
      ...prev,
      patients: existing ? prev.patients : [targetPatient, ...prev.patients],
      visits: [newVisit, ...prev.visits],
      auditEvents: [audit, ...prev.auditEvents],
    }));

    setSelectedVisitId(newVisitId);
    setActiveTab('ticket');
    showNotice(
      'success',
      lang === 'ne'
        ? `टोकन ${tokenStr} दर्ता भयो। पर्चा छाप्नुहोस्।`
        : `Token ${tokenStr} registered successfully. Print token slip.`
    );
  };

  const handleCallNext = (counterId: number) => {
    const counter = store.counters.find((c) => c.id === counterId);
    if (!counter || !counter.isOpen) return;

    const dept = store.departments.find((d) => d.id === counter.departmentId);
    if (!dept || !dept.isOpen) return;

    const occupied = store.visits.find(
      (v) => v.counterId === counter.id && (v.status === 'called' || v.status === 'in_service')
    );
    if (occupied) {
      showNotice(
        'error',
        lang === 'ne'
          ? `काउन्टर व्यस्त छ: टोकन ${occupied.token} को सेवा सम्पन्न गर्नुहोस्।`
          : `Counter is busy. Complete consultation for ${occupied.token} first.`
      );
      return;
    }

    const eligibleWaiting = store.visits
      .filter((v) => v.departmentId === dept.id && v.date === todayStr && v.status === 'waiting')
      .sort((a, b) => {
        if (a.subQueue === 'urgent' && b.subQueue !== 'urgent') return -1;
        if (b.subQueue === 'urgent' && a.subQueue !== 'urgent') return 1;
        if (a.subQueue === 'review' && b.subQueue !== 'review') return -1;
        if (b.subQueue === 'review' && a.subQueue !== 'review') return 1;
        return new Date(a.queuedAt).getTime() - new Date(b.queuedAt).getTime();
      });

    if (eligibleWaiting.length === 0) {
      showNotice('warning', lang === 'ne' ? 'कुनै पनि बिरामी पालो पर्खिरहेका छैनन्।' : 'No patients waiting in this queue.');
      return;
    }

    const target = eligibleWaiting[0];
    const nowIso = new Date().toISOString();

    const updatedVisit: Visit = {
      ...target,
      status: 'called',
      counterId: counter.id,
      counter: counter,
      calledAt: nowIso,
      version: target.version + 1,
    };

    const audit: AuditEvent = {
      id: generateUUID(),
      actor: currentUser.fullName,
      visitId: target.id,
      visitToken: target.token,
      action: 'Called / बोलाइयो',
      reason: counter.name,
      createdAt: nowIso,
    };

    setStore((prev) => ({
      ...prev,
      visits: prev.visits.map((v) => (v.id === target.id ? updatedVisit : v)),
      auditEvents: [audit, ...prev.auditEvents],
    }));

    speakAnnouncement(target.token, lang === 'ne' ? counter.nameNe : counter.name);
    showNotice('success', `${target.token} -> ${lang === 'ne' ? counter.nameNe : counter.name}`);
  };

  const handleStartService = (visitId: string) => {
    const visit = store.visits.find((v) => v.id === visitId);
    if (!visit || visit.status !== 'called') return;

    const nowIso = new Date().toISOString();
    const updatedVisit: Visit = {
      ...visit,
      status: 'in_service',
      startedAt: nowIso,
      version: visit.version + 1,
    };

    const audit: AuditEvent = {
      id: generateUUID(),
      actor: currentUser.fullName,
      visitId: visit.id,
      visitToken: visit.token,
      action: 'In service / परामर्श सुरु',
      reason: 'Identity confirmed / परिचय प्रमाणित',
      createdAt: nowIso,
    };

    setStore((prev) => ({
      ...prev,
      visits: prev.visits.map((v) => (v.id === visit.id ? updatedVisit : v)),
      auditEvents: [audit, ...prev.auditEvents],
    }));

    showNotice('success', `${visit.token}: ${lang === 'ne' ? 'परामर्श सुरु भयो' : 'Service started'}`);
  };

  const handleDoctorCompleteOrOrder = (
    visitId: string,
    options: {
      orderLab: boolean;
      orderXray: boolean;
      prescription: string;
    }
  ) => {
    const visit = store.visits.find((v) => v.id === visitId);
    if (!visit) return;

    const nowIso = new Date().toISOString();
    const newOrders: ClinicalOrder[] = [...visit.orders];

    if (options.orderLab) {
      newOrders.push({
        id: generateUUID(),
        category: 'lab',
        testCode: 'CBC_LFT',
        testNameEn: 'Blood Investigation (CBC & LFT)',
        testNameNe: 'रगत जाँच (CBC तथा LFT)',
        isPaid: visit.patient.bimaNumber ? true : false,
        paymentStatus: visit.patient.bimaNumber ? 'bima_verified' : 'unpaid',
        specimenStatus: 'pending',
        isReportReady: false,
        createdAt: nowIso,
      });
    }

    if (options.orderXray) {
      newOrders.push({
        id: generateUUID(),
        category: 'radiology',
        testCode: 'CXR',
        testNameEn: 'Chest X-Ray (PA View)',
        testNameNe: 'छातीको एक्स-रे',
        isPaid: visit.patient.bimaNumber ? true : false,
        paymentStatus: visit.patient.bimaNumber ? 'bima_verified' : 'unpaid',
        specimenStatus: 'pending',
        isReportReady: false,
        createdAt: nowIso,
      });
    }

    let nextDeptId = visit.departmentId;
    let nextStatus: VisitStatus = 'completed';

    if (options.orderLab || options.orderXray) {
      if (visit.patient.bimaNumber) {
        nextDeptId = labDept.id;
        nextStatus = 'waiting';
      } else {
        nextDeptId = billDept.id;
        nextStatus = 'waiting';
      }
    } else if (options.prescription) {
      nextDeptId = phrDept.id;
      nextStatus = 'waiting';
    }

    const updatedVisit: Visit = {
      ...visit,
      departmentId: nextDeptId,
      department: store.departments.find((d) => d.id === nextDeptId) || visit.department,
      counterId: null,
      counter: null,
      status: nextStatus,
      orders: newOrders,
      prescriptionNotes: options.prescription,
      finishedAt: nextStatus === 'completed' ? nowIso : undefined,
      queuedAt: nowIso,
      version: visit.version + 1,
    };

    const audit: AuditEvent = {
      id: generateUUID(),
      actor: currentUser.fullName,
      visitId: visit.id,
      visitToken: visit.token,
      action: nextStatus === 'completed' ? 'Completed / सम्पन्न' : 'Routed / अर्को चरणमा प्रेषित',
      reason: options.orderLab ? 'Ordered Lab + Review' : options.prescription ? 'Prescription Dispense' : 'Direct Exit',
      createdAt: nowIso,
    };

    setStore((prev) => ({
      ...prev,
      visits: prev.visits.map((v) => (v.id === visit.id ? updatedVisit : v)),
      auditEvents: [audit, ...prev.auditEvents],
    }));

    showNotice(
      'success',
      lang === 'ne'
        ? `टोकन ${visit.token} अद्यावधिक भयो। अर्को गन्तव्य: ${updatedVisit.department.nameNe}`
        : `Token ${visit.token} updated. Next step: ${updatedVisit.department.name}`
    );
  };

  const handleClearBilling = (visitId: string, paymentType: PaymentStatus, receiptNo: string) => {
    const visit = store.visits.find((v) => v.id === visitId);
    if (!visit) return;

    const nowIso = new Date().toISOString();
    const updatedOrders = visit.orders.map((o) => ({
      ...o,
      isPaid: true,
      paymentStatus: paymentType,
      receiptNumber: receiptNo || `RCP-${Math.floor(1000 + Math.random() * 9000)}`,
    }));

    const updatedVisit: Visit = {
      ...visit,
      departmentId: labDept.id,
      department: labDept,
      counterId: null,
      counter: null,
      status: 'waiting',
      orders: updatedOrders,
      queuedAt: nowIso,
      version: visit.version + 1,
    };

    const audit: AuditEvent = {
      id: generateUUID(),
      actor: currentUser.fullName,
      visitId: visit.id,
      visitToken: visit.token,
      action: 'Payment Verified / भुक्तानी स्वीकृत',
      reason: `${paymentType} · Receipt #${receiptNo || 'AUTO'}`,
      createdAt: nowIso,
    };

    setStore((prev) => ({
      ...prev,
      visits: prev.visits.map((v) => (v.id === visit.id ? updatedVisit : v)),
      auditEvents: [audit, ...prev.auditEvents],
    }));

    showNotice('success', `${visit.token}: ${lang === 'ne' ? 'भुक्तानी सम्पन्न। प्रयोगशाला पठाइयो।' : 'Payment cleared. Sent to Lab.'}`);
  };

  const handleCollectSpecimen = (visitId: string) => {
    const visit = store.visits.find((v) => v.id === visitId);
    if (!visit) return;

    const nowIso = new Date().toISOString();
    const updatedOrders = visit.orders.map((o) =>
      o.category === 'lab' ? { ...o, specimenStatus: 'collected' as const } : o
    );

    const updatedVisit: Visit = {
      ...visit,
      orders: updatedOrders,
      version: visit.version + 1,
    };

    const audit: AuditEvent = {
      id: generateUUID(),
      actor: currentUser.fullName,
      visitId: visit.id,
      visitToken: visit.token,
      action: 'Sample Collected / नमुना संकलित',
      reason: 'EDTA Vacutainer',
      createdAt: nowIso,
    };

    setStore((prev) => ({
      ...prev,
      visits: prev.visits.map((v) => (v.id === visit.id ? updatedVisit : v)),
      auditEvents: [audit, ...prev.auditEvents],
    }));

    showNotice('success', `${visit.token}: ${lang === 'ne' ? 'रगत नमुना संकलन भयो।' : 'Sample collected.'}`);
  };

  const handleMarkReportReady = (visitId: string) => {
    const visit = store.visits.find((v) => v.id === visitId);
    if (!visit) return;

    const nowIso = new Date().toISOString();
    const updatedOrders = visit.orders.map((o) => ({
      ...o,
      isReportReady: true,
      completedAt: nowIso,
    }));

    // Auto-promote to original OPD consultation room Review Sub-Queue!
    const opdDept = store.departments.find((d) => d.id === 1) || visit.department;
    const updatedVisit: Visit = {
      ...visit,
      departmentId: opdDept.id,
      department: opdDept,
      counterId: null,
      counter: null,
      status: 'waiting',
      subQueue: 'review',
      orders: updatedOrders,
      queuedAt: nowIso,
      version: visit.version + 1,
    };

    const audit: AuditEvent = {
      id: generateUUID(),
      actor: currentUser.fullName,
      visitId: visit.id,
      visitToken: visit.token,
      action: 'Report Ready / रिपोर्ट प्रमाणित',
      reason: 'Auto-promoted to Doctor Review Queue',
      createdAt: nowIso,
    };

    setStore((prev) => ({
      ...prev,
      visits: prev.visits.map((v) => (v.id === visit.id ? updatedVisit : v)),
      auditEvents: [audit, ...prev.auditEvents],
    }));

    showNotice(
      'success',
      lang === 'ne'
        ? `टोकन ${visit.token} को रिपोर्ट तयार भयो। डाक्टर रिभ्यु सूचीमा थपियो!`
        : `Report ready for ${visit.token}. Auto-promoted to Doctor Review Queue!`
    );
  };

  const handlePharmacyDispense = (visitId: string) => {
    const visit = store.visits.find((v) => v.id === visitId);
    if (!visit) return;

    const nowIso = new Date().toISOString();
    const updatedVisit: Visit = {
      ...visit,
      status: 'completed',
      counterId: null,
      counter: null,
      finishedAt: nowIso,
      version: visit.version + 1,
    };

    const audit: AuditEvent = {
      id: generateUUID(),
      actor: currentUser.fullName,
      visitId: visit.id,
      visitToken: visit.token,
      action: 'Medication Dispensed / औषधि वितरण सम्पन्न',
      reason: 'Visit Closed / यात्रा समाप्त',
      createdAt: nowIso,
    };

    setStore((prev) => ({
      ...prev,
      visits: prev.visits.map((v) => (v.id === visit.id ? updatedVisit : v)),
      auditEvents: [audit, ...prev.auditEvents],
    }));

    showNotice('success', `${visit.token}: ${lang === 'ne' ? 'औषधि दिई यात्रा सम्पन्न गरियो।' : 'Medication dispensed. Visit completed.'}`);
  };

  const handleAbsence = (visitId: string, reason: string) => {
    const visit = store.visits.find((v) => v.id === visitId);
    if (!visit) return;

    const nowIso = new Date().toISOString();
    const updatedVisit: Visit = {
      ...visit,
      status: 'absent',
      counterId: null,
      counter: null,
      version: visit.version + 1,
    };

    const audit: AuditEvent = {
      id: generateUUID(),
      actor: currentUser.fullName,
      visitId: visit.id,
      visitToken: visit.token,
      action: 'Temporarily Absent / अनुपस्थित',
      reason: reason || 'No response to calls',
      createdAt: nowIso,
    };

    setStore((prev) => ({
      ...prev,
      visits: prev.visits.map((v) => (v.id === visit.id ? updatedVisit : v)),
      auditEvents: [audit, ...prev.auditEvents],
    }));

    showNotice('warning', `${visit.token}: ${lang === 'ne' ? 'अस्थायी अनुपस्थित जनाइयो।' : 'Marked temporarily absent.'}`);
  };

  const handleClinicalOverride = (visitId: string) => {
    const visit = store.visits.find((v) => v.id === visitId);
    if (!visit) return;

    const nowIso = new Date().toISOString();
    const updatedVisit: Visit = {
      ...visit,
      subQueue: 'urgent',
      isClinicalEmergency: true,
      version: visit.version + 1,
    };

    const audit: AuditEvent = {
      id: generateUUID(),
      actor: currentUser.fullName,
      visitId: visit.id,
      visitToken: visit.token,
      action: 'Clinical Urgent Override / आकस्मिक प्राथमिकता',
      reason: 'Nurse Triage Clinical Assessment',
      createdAt: nowIso,
    };

    setStore((prev) => ({
      ...prev,
      visits: prev.visits.map((v) => (v.id === visit.id ? updatedVisit : v)),
      auditEvents: [audit, ...prev.auditEvents],
    }));

    showNotice('warning', `${visit.token}: ${lang === 'ne' ? 'आकस्मिक स्वास्थ्य प्राथमिकता थपियो!' : 'Elevated to Urgent Clinical Priority!'}`);
  };

  // Filtered departments for Overview
  const filteredDepartments = useMemo(() => {
    if (overviewCategory === 'all') return store.departments;
    if (overviewCategory === 'opd') return store.departments.filter((d) => d.type === 'opd');
    if (overviewCategory === 'diagnostics') return store.departments.filter((d) => d.type === 'lab' || d.type === 'radiology');
    if (overviewCategory === 'support') return store.departments.filter((d) => d.type === 'billing' || d.type === 'pharmacy');
    return store.departments;
  }, [store.departments, overviewCategory]);

  return (
    <div>
      {/* PUBLIC TV DISPLAY VIEW OVERLAY IF ACTIVE */}
      {activeTab === 'display' ? (
        <main className="display-page">
          <header className="display-header">
            <div className="brand">
              <span className="brand-mark">S</span>
              <div>
                <span style={{ fontSize: '24px', fontWeight: 800, color: '#fff' }}>{t.brandName}</span>
                <small style={{ color: '#a6cbbb', display: 'block' }}>{t.hospitalName}</small>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div className="lang-toggle">
                <button className={`lang-btn ${lang === 'en' ? 'active' : ''}`} onClick={() => setLang('en')}>
                  English
                </button>
                <button className={`lang-btn ${lang === 'ne' ? 'active' : ''}`} onClick={() => setLang('ne')}>
                  नेपाली
                </button>
              </div>
              <button className="button secondary" style={{ minHeight: '34px', padding: '6px 14px' }} onClick={() => setActiveTab('overview')}>
                {t.actions.exitDisplay}
              </button>
            </div>
          </header>

          <section className="display-main">
            <p className="eyebrow" style={{ color: '#9ad0be' }}>
              {lang === 'ne' ? 'प्रतीक्षालय जानकारी स्क्रिन' : 'WAITING AREA PUBLIC DISPLAY'}
            </p>
            <h1>{lang === 'ne' ? 'कृपया आफ्नो टोकन र कोठा नम्बर हेर्नुहोस्' : 'Please follow your token to your destination.'}</h1>
            <p className="display-status">
              {lang === 'ne' ? 'बोलाइएका टोकनहरू र परामर्श जारी' : 'Called tokens and consultations currently in progress'}
            </p>

            <div className="display-calls" aria-live="polite">
              {todayVisits.filter((v) => v.status === 'called' || v.status === 'in_service').length > 0 ? (
                todayVisits.filter((v) => v.status === 'called' || v.status === 'in_service').map((v) => (
                  <article key={v.id} className="display-call">
                    <small>{v.counter ? (lang === 'ne' ? v.counter.nameNe : v.counter.name) : (lang === 'ne' ? v.department.nameNe : v.department.name)}</small>
                    <strong>{v.token}</strong>
                    <span>{lang === 'ne' ? v.department.locationNe : v.department.location}</span>
                  </article>
                ))
              ) : (
                <p className="display-empty">
                  {lang === 'ne' ? 'कृपया कुर्सीमा आराम गर्नुहोस्। नयाँ टोकन बोलाइँदै छ।' : 'Please take a seat. Next token will appear here shortly.'}
                </p>
              )}
            </div>

            {/* Reports ready for doctor review */}
            {todayVisits.filter((v) => v.subQueue === 'review').length > 0 && (
              <div style={{ marginTop: '30px', padding: '20px', background: '#1c423e', borderRadius: '12px', border: '1px solid #336f66' }}>
                <h3 style={{ color: '#ffebc4', margin: '0 0 10px 0', fontSize: '18px' }}>
                  {lang === 'ne' ? '📋 रिपोर्ट तयार भएका टोकनहरू (डाक्टर कक्षमा जानुहोस्):' : '📋 Reports Ready for Doctor Review (Proceed to OPD Room):'}
                </h3>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  {todayVisits.filter((v) => v.subQueue === 'review').map((r) => (
                    <span key={r.id} style={{ background: '#e0e7ff', color: '#1e1b4b', fontWeight: 800, padding: '6px 14px', borderRadius: '8px', fontSize: '18px' }}>
                      {r.token} ({lang === 'ne' ? r.department.prefix : r.department.prefix})
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="display-summary" style={{ marginTop: '30px' }}>
              <span>
                <b>{waitingCount}</b> {t.patientQuestions.patientsAhead}
              </span>
              <span>
                {lang === 'ne' ? 'काठमाडौं समय:' : 'Kathmandu Time:'}{' '}
                {new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            </div>
          </section>

          <footer className="display-footer">
            <div>
              <b>{lang === 'ne' ? 'सहयोग चाहिएमा सोधपुछ कक्षमा सम्पर्क गर्नुहोस्।' : 'Need assistance? Please ask Reception Desk.'}</b>
              <span style={{ display: 'block', fontSize: '12px', color: '#88b5a5' }}>
                {lang === 'ne' ? 'स्मार्टफोन आवश्यक छैन। कर्मचारीले तपाईंको पालोमा सहयोग गर्नेछन्।' : 'No smartphone required. Qualified staff will guide you through each step.'}
              </span>
            </div>
            <div>SmartQ v2.0 · 14 OPD Specialties · Nepal Health Services</div>
          </footer>
        </main>
      ) : activeTab === 'ticket' && selectedVisitId ? (
        /* PRINTABLE THERMAL TICKET VIEW (80mm) */
        <main className="ticket-page">
          <div className="no-print" style={{ marginBottom: '16px' }}>
            <button className="text-link" style={{ fontSize: '14px' }} onClick={() => setActiveTab('overview')}>
              ← {lang === 'ne' ? 'ड्यासबोर्ड फर्कनुहोस्' : 'Back to Dashboard'}
            </button>
          </div>

          <div className="ticket">
            <span className="ticket-brand">{t.brandName}</span>
            <p style={{ margin: '4px 0 12px 0', fontWeight: 600 }}>{t.hospitalName}</p>
            <hr />
            <span className="eyebrow" style={{ color: '#2b5641' }}>{t.ticket.visitToken}</span>
            <h1>{patientVisit.token}</h1>

            {patientVisit.isClinicalEmergency && (
              <div style={{ background: '#fee2e2', border: '2px solid #ef4444', borderRadius: '6px', padding: '6px 10px', margin: '8px 0', color: '#991b1b', fontWeight: 800, fontSize: '13px', textAlign: 'center' }}>
                🚨 {lang === 'ne' ? 'आकस्मिक बिरामी (EMERGENCY) — तत्काल जाँच' : 'EMERGENCY CASE — IMMEDIATE TRIAGE'}
              </div>
            )}

            {patientVisit.patient.hasDisability && (
              <div style={{ background: '#eff6ff', border: '2px solid #3b82f6', borderRadius: '6px', padding: '6px 10px', margin: '8px 0', color: '#1e40af', fontWeight: 800, fontSize: '13px', textAlign: 'center' }}>
                ♿ {lang === 'ne' ? 'अपाङ्गता भएका व्यक्ति — विशेष पहुँच तथा प्राथमिकता' : 'PHYSICALLY DISABLED — ACCESSIBILITY PRIORITY'}
              </div>
            )}

            {patientVisit.patient.isSenior && !patientVisit.isClinicalEmergency && !patientVisit.patient.hasDisability && (
              <div style={{ background: '#fef3c7', border: '1px solid #f59e0b', borderRadius: '4px', padding: '4px 8px', margin: '6px 0', color: '#92400e', fontWeight: 700, fontSize: '11.5px', textAlign: 'center' }}>
                👴 {lang === 'ne' ? 'ज्येष्ठ नागरिक (६५+) प्राथमिकता' : 'SENIOR CITIZEN (65+) PRIORITY'}
              </div>
            )}

            {patientVisit.patient.isPregnant && !patientVisit.isClinicalEmergency && (
              <div style={{ background: '#fce7f3', border: '1px solid #ec4899', borderRadius: '4px', padding: '4px 8px', margin: '6px 0', color: '#9d174d', fontWeight: 700, fontSize: '11.5px', textAlign: 'center' }}>
                🤰 {lang === 'ne' ? 'गर्भवती महिला प्राथमिकता' : 'MATERNAL CARE PRIORITY'}
              </div>
            )}

            <div style={{ margin: '8px 0', padding: '6px 0', borderTop: '1px dashed #cbd5e1', borderBottom: '1px dashed #cbd5e1' }}>
              <b style={{ fontSize: '14px', display: 'block' }}>{patientVisit.patient.name}</b>
              <small style={{ color: '#475569', fontSize: '11px' }}>
                {patientVisit.patient.hospitalId} · {patientVisit.patient.age ? `${patientVisit.patient.age} yrs` : 'Age: N/A'} · {patientVisit.patient.gender}
                {patientVisit.patient.bimaNumber && ` · Bima: ${patientVisit.patient.bimaNumber}`}
              </small>
            </div>

            <p style={{ fontSize: '15px', fontWeight: 700, margin: '6px 0', color: 'var(--teal)' }}>
              {lang === 'ne' ? patientVisit.department.nameNe : patientVisit.department.name}
            </p>
            <p style={{ color: '#444', fontSize: '13px' }}>
              📍 {lang === 'ne' ? patientVisit.department.locationNe : patientVisit.department.location}
            </p>
            {patientVisit.department.description && (
              <small style={{ color: '#666', display: 'block', marginTop: '4px' }}>
                {lang === 'ne' ? patientVisit.department.descriptionNe : patientVisit.department.description}
              </small>
            )}

            <div className="ticket-qr-placeholder">
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '28px' }}>🏁</div>
                <small style={{ fontSize: '9px', display: 'block', marginTop: '4px' }}>QR: {patientVisit.token}</small>
                <strong style={{ fontSize: '11px', display: 'block' }}>PIN: {patientVisit.pinCode}</strong>
              </div>
            </div>

            <p style={{ fontSize: '11px', color: '#666', margin: '8px 0' }}>
              {new Date(patientVisit.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} ·{' '}
              {new Date(patientVisit.createdAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
            </p>
            <hr />
            <p style={{ fontSize: '12px' }}>{t.ticket.noPhoneRequired}</p>
            <small style={{ display: 'block', fontSize: '10px', color: '#777', marginTop: '6px' }}>
              {t.ticket.clinicalWarning}
            </small>
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '10px', flexWrap: 'wrap' }}>
            <button type="button" className="button no-print" onClick={() => window.print()}>
              🖨️ {t.actions.printTicket}
            </button>
            <button
              type="button"
              className="button secondary no-print"
              onClick={() => {
                setSelectedVisitId(patientVisit.id);
                setActiveTab('patientView');
              }}
            >
              📱 {lang === 'ne' ? 'मेरो पालो ट्र्याकर खोल्नुहोस्' : 'Track on Mobile (Mero Palo)'}
            </button>
          </div>
          <p className="no-print muted" style={{ marginTop: '10px', fontSize: '12px' }}>
            {lang === 'ne' ? 'प्रिन्टरबाट ८० एमएम पर्चा निकाल्नुहोस् वा पीडीएफ सेभ गर्नुहोस्।' : 'Prints standard 80mm hospital ticket slip.'}
          </p>
        </main>
      ) : (
        /* STANDARD WORKSPACE LAYOUT */
        <div>
          <aside className="sidebar">
            <a className="brand" href="#" onClick={(e) => { e.preventDefault(); setActiveTab('overview'); }}>
              <span className="brand-mark">S</span>
              <div>
                <span>SmartQ</span>
                <small>{lang === 'ne' ? '१४ ओपिडी सेवाहरू सहित' : '14 OPD Specialties'}</small>
              </div>
            </a>

            <p className="nav-label">{t.nav.overview}</p>
            <nav aria-label="Main Navigation">
              <button className={`nav-btn ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>
                📊 {t.nav.overview}
              </button>
              <button className={`nav-btn ${activeTab === 'patientView' ? 'active' : ''}`} onClick={() => setActiveTab('patientView')}>
                📱 {lang === 'ne' ? 'मेरो पालो (Patient Live Tracker)' : 'Mero Palo (Live Tracker)'}
              </button>
              <button className={`nav-btn ${activeTab === 'register' ? 'active' : ''}`} onClick={() => setActiveTab('register')}>
                ➕ {t.nav.register}
              </button>

              <p className="nav-label">{lang === 'ne' ? 'क्लिनिकल तथा ओपिडी डेस्क' : 'CLINICAL & OPD DESKS'}</p>
              <button className={`nav-btn ${activeTab === 'doctorDesk' ? 'active' : ''}`} onClick={() => { setActiveRole('doctor'); setActiveTab('doctorDesk'); }}>
                🩺 {t.nav.doctorDesk}
              </button>
              <button className={`nav-btn ${activeTab === 'billingDesk' ? 'active' : ''}`} onClick={() => { setActiveRole('cashier'); setActiveTab('billingDesk'); }}>
                💳 {t.nav.billingDesk}
              </button>
              <button className={`nav-btn ${activeTab === 'labDesk' ? 'active' : ''}`} onClick={() => { setActiveRole('lab'); setActiveTab('labDesk'); }}>
                🔬 {t.nav.labDesk}
              </button>
              <button className={`nav-btn ${activeTab === 'radiologyDesk' ? 'active' : ''}`} onClick={() => { setActiveRole('radiology'); setActiveTab('radiologyDesk'); }}>
                🩻 {t.nav.radiologyDesk}
              </button>
              <button className={`nav-btn ${activeTab === 'pharmacyDesk' ? 'active' : ''}`} onClick={() => { setActiveRole('pharmacy'); setActiveTab('pharmacyDesk'); }}>
                💊 {t.nav.pharmacyDesk}
              </button>

              <p className="nav-label">{lang === 'ne' ? 'प्रशासन र टिभी' : 'FACILITY & DISPLAY'}</p>
              <button className={`nav-btn ${(activeTab as string) === 'display' ? 'active' : ''}`} onClick={() => setActiveTab('display')}>
                📺 {t.nav.publicDisplay}
              </button>
              <button className={`nav-btn ${activeTab === 'adminKpis' ? 'active' : ''}`} onClick={() => { setActiveRole('admin'); setActiveTab('adminKpis'); }}>
                ⚙️ {t.nav.adminKpis}
              </button>
              <button className={`nav-btn ${activeTab === 'activity' ? 'active' : ''}`} onClick={() => setActiveTab('activity')}>
                📜 {t.nav.activity}
              </button>
            </nav>

            <div className="sidebar-foot">
              <span className="pill">SMARTQ v3.0</span>
              <p>{lang === 'ne' ? '१४ ओपिडी विशेषज्ञ सेवा' : '14 OPD Specialties'}</p>
              <small>{lang === 'ne' ? 'नेपाली अस्पतालहरूका लागि' : 'Standard Hospital Setup'}</small>
            </div>
          </aside>

          <div className="workspace">
            <header className="topbar">
              <div className="site-name">
                SmartQ Nepal <span className="muted">/ {t.hospitalName}</span>
              </div>

              <div className="topbar-controls">
                {/* Database Connection Status Badge */}
                <div
                  className="db-badge"
                  title={dbConnected ? `SQLite Database Active (smartq.db) · ${dbStats?.totalVisits || 0} visits stored` : 'Database offline'}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '4px 10px',
                    borderRadius: '20px',
                    fontSize: '11px',
                    fontWeight: 600,
                    background: dbConnected ? '#ecfdf5' : '#fef2f2',
                    color: dbConnected ? '#065f46' : '#991b1b',
                    border: `1px solid ${dbConnected ? '#a7f3d0' : '#fecaca'}`,
                  }}
                >
                  <span
                    style={{
                      width: '7px',
                      height: '7px',
                      borderRadius: '50%',
                      background: dbConnected ? '#10b981' : '#ef4444',
                      boxShadow: dbConnected ? '0 0 6px #10b981' : 'none',
                    }}
                  />
                  <span>{dbConnected ? 'SQLite DB' : 'Offline'}</span>
                </div>

                {/* Language Switcher */}
                <div className="lang-toggle" title="Switch Language / भाषा परिवर्तन गर्नुहोस्">
                  <button className={`lang-btn ${lang === 'en' ? 'active' : ''}`} onClick={() => setLang('en')}>
                    EN
                  </button>
                  <button className={`lang-btn ${lang === 'ne' ? 'active' : ''}`} onClick={() => setLang('ne')}>
                    नेपाली
                  </button>
                </div>

                {/* Role Switcher */}
                <div className="role-switcher">
                  <span>{t.role}:</span>
                  <select value={activeRole} onChange={(e) => handleRoleChange(e.target.value as StaffRole)}>
                    <option value="patient">👤 {t.roles.patient}</option>
                    <option value="reception">📝 {t.roles.reception}</option>
                    <option value="doctor">🩺 {t.roles.doctor}</option>
                    <option value="cashier">💳 {t.roles.cashier}</option>
                    <option value="lab">🔬 {t.roles.lab}</option>
                    <option value="radiology">🩻 {t.roles.radiology}</option>
                    <option value="pharmacy">💊 {t.roles.pharmacy}</option>
                    <option value="admin">⚙️ {t.roles.admin}</option>
                  </select>
                </div>

                <button className="quiet" onClick={() => { if (window.confirm('Reset demo state with 14 specialties?')) { setStore(resetToDemo()); showNotice('success', 'Reset complete'); } }}>
                  ↻ {t.actions.resetDemo}
                </button>
              </div>
            </header>

            <main id="main" className="main">
              {notice && <div className={`notice ${notice.type}`}>{notice.message}</div>}

              {/* VIEW: OVERVIEW */}
              {activeTab === 'overview' && (
                <div>
                  <div className="page-heading">
                    <div>
                      <p className="eyebrow">
                        {lang === 'ne' ? 'दैनिक सारांश' : "TODAY'S SUMMARY"} ·{' '}
                        {new Date().toLocaleDateString(lang === 'ne' ? 'ne-NP' : 'en-GB', {
                          weekday: 'short',
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </p>
                      <h1>{lang === 'ne' ? 'अस्पताल ओपिडी तथा पालो ड्यासबोर्ड' : 'Hospital OPD Flow Dashboard'}</h1>
                      <p className="muted">
                        {lang === 'ne'
                          ? '१४ ओपिडी विशेषज्ञ सेवाहरू, ल्याब, एक्स-रे, बिलिङ र फार्मेसीको प्रत्यक्ष समन्वय।'
                          : '14 Common OPD Specialties, Diagnostic Labs, Radiology, Billing, and Pharmacy Coordination.'}
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button className="button" onClick={() => setActiveTab('register')}>
                        ➕ {t.nav.register}
                      </button>
                      <button className="button secondary" onClick={() => setActiveTab('display')}>
                        📺 {t.nav.publicDisplay}
                      </button>
                    </div>
                  </div>

                  {/* STATS */}
                  <section className="stats">
                    <article>
                      <span>{t.stats.visitsToday}</span>
                      <strong>{String(todayVisits.length).padStart(2, '0')}</strong>
                      <small>{lang === 'ne' ? 'सबै विभागहरूमा' : 'Across 18 departments'}</small>
                    </article>
                    <article>
                      <span>{t.stats.waitingNow}</span>
                      <strong>{String(waitingCount).padStart(2, '0')}</strong>
                      <small>{lang === 'ne' ? 'बोलाउन बाँकी' : 'Ready for call'}</small>
                    </article>
                    <article>
                      <span>{t.stats.servingNow}</span>
                      <strong>{String(servingCount).padStart(2, '0')}</strong>
                      <small>{lang === 'ne' ? 'परामर्श वा जाँचमा' : 'In rooms / chairs'}</small>
                    </article>
                    <article>
                      <span>{t.stats.completedToday}</span>
                      <strong>{String(completedCount).padStart(2, '0')}</strong>
                      <small>{lang === 'ne' ? 'यात्रा सम्पन्न' : 'Finished care'}</small>
                    </article>
                  </section>

                  {/* CATEGORY FILTER TABS FOR 18 DEPARTMENTS */}
                  <div className="section-heading">
                    <h2>{lang === 'ne' ? 'ओपिडी विभाग तथा सेवाहरू' : 'OPD Specialties & Departments'}</h2>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <button className={`button ${overviewCategory === 'all' ? '' : 'secondary'}`} style={{ minHeight: '32px', padding: '4px 10px', fontSize: '12px' }} onClick={() => setOverviewCategory('all')}>
                        {lang === 'ne' ? 'सबै (१८)' : 'All (18)'}
                      </button>
                      <button className={`button ${overviewCategory === 'opd' ? '' : 'secondary'}`} style={{ minHeight: '32px', padding: '4px 10px', fontSize: '12px' }} onClick={() => setOverviewCategory('opd')}>
                        {lang === 'ne' ? '१४ ओपिडी सेवाहरू' : '14 OPD Specialties'}
                      </button>
                      <button className={`button ${overviewCategory === 'diagnostics' ? '' : 'secondary'}`} style={{ minHeight: '32px', padding: '4px 10px', fontSize: '12px' }} onClick={() => setOverviewCategory('diagnostics')}>
                        {lang === 'ne' ? 'ल्याब र एक्स-रे' : 'Diagnostics (Lab/X-Ray)'}
                      </button>
                      <button className={`button ${overviewCategory === 'support' ? '' : 'secondary'}`} style={{ minHeight: '32px', padding: '4px 10px', fontSize: '12px' }} onClick={() => setOverviewCategory('support')}>
                        {lang === 'ne' ? 'बिलिङ र फार्मेसी' : 'Billing & Pharmacy'}
                      </button>
                    </div>
                  </div>

                  <section className="department-grid">
                    {filteredDepartments.map((dept) => {
                      const deptVisits = todayVisits.filter((v) => v.departmentId === dept.id);
                      const waiting = deptVisits.filter((v) => v.status === 'waiting').length;
                      const active = deptVisits.filter((v) => v.status === 'called' || v.status === 'in_service').length;

                      return (
                        <article key={dept.id} className="department-card">
                          <div className="card-top">
                            <span className="department-icon">{dept.prefix}</span>
                            <span className={`badge ${dept.isOpen ? 'waiting' : 'absent'}`}>
                              {dept.isOpen ? (lang === 'ne' ? 'खुला' : 'Open') : (lang === 'ne' ? 'बन्द' : 'Closed')}
                            </span>
                          </div>
                          <h3 style={{ fontSize: '16px', marginBottom: '4px' }}>
                            {lang === 'ne' ? dept.nameNe : dept.name}
                          </h3>
                          <p className="muted" style={{ fontSize: '12px', marginBottom: '8px' }}>
                            📍 {lang === 'ne' ? dept.locationNe : dept.location}
                          </p>
                          {dept.description && (
                            <p style={{ fontSize: '11.5px', color: '#555', marginBottom: '14px', lineHeight: '1.4' }}>
                              {lang === 'ne' ? dept.descriptionNe : dept.description}
                            </p>
                          )}
                          <div className="department-numbers">
                            <span><b>{waiting}</b> {lang === 'ne' ? 'पर्खँदै' : 'waiting'}</span>
                            <span><b>{active}</b> {lang === 'ne' ? 'सेवामा' : 'active'}</span>
                          </div>
                          <a
                            className="card-link"
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              if (dept.type === 'opd') {
                                setSelectedDoctorDeptId(dept.id);
                                setActiveRole('doctor');
                                setActiveTab('doctorDesk');
                              } else if (dept.type === 'billing') {
                                setActiveRole('cashier');
                                setActiveTab('billingDesk');
                              } else if (dept.type === 'lab') {
                                setActiveRole('lab');
                                setActiveTab('labDesk');
                              } else if (dept.type === 'radiology') {
                                setActiveRole('radiology');
                                setActiveTab('radiologyDesk');
                              } else if (dept.type === 'pharmacy') {
                                setActiveRole('pharmacy');
                                setActiveTab('pharmacyDesk');
                              }
                            }}
                          >
                            {lang === 'ne' ? 'कार्यकक्ष खोल्नुहोस्' : 'Open Station'} <span>→</span>
                          </a>
                        </article>
                      );
                    })}
                  </section>

                  {/* ACTIVE VISITS TABLE */}
                  <div className="section-heading" style={{ marginTop: '30px' }}>
                    <h2>{lang === 'ne' ? 'भर्खरका बिरामी दर्ता तथा स्थिति' : 'Active Patient Journeys'}</h2>
                    <span className="muted">Latest updates</span>
                  </div>

                  <div className="panel table-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>Token</th>
                          <th>Patient</th>
                          <th>Specialty / Department</th>
                          <th>Status</th>
                          <th>Queue Sub-type</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {todayVisits.map((v) => (
                          <tr key={v.id}>
                            <td><span className="token-chip">{v.token}</span></td>
                            <td>
                              <b>{v.patient.name}</b>
                              <small className="block muted">{v.patient.hospitalId} · {v.patient.age || '—'} yrs · {v.patient.gender}</small>
                            </td>
                            <td>
                              <b>{lang === 'ne' ? v.department.nameNe : v.department.name}</b>
                              <small className="block muted">{lang === 'ne' ? v.department.locationNe : v.department.location}</small>
                            </td>
                            <td>
                              <span className={`badge ${v.status}`}>{getStatusText(v.status)}</span>
                            </td>
                            <td>
                              {v.isClinicalEmergency && <span className="badge urgent">🚨 Emergency</span>}
                              {v.patient.hasDisability && (
                                <span className="badge" style={{ background: '#dbeafe', color: '#1e40af', border: '1px solid #93c5fd', marginLeft: v.isClinicalEmergency ? '4px' : '0' }}>
                                  ♿ Disabled
                                </span>
                              )}
                              {!v.isClinicalEmergency && !v.patient.hasDisability && v.subQueue === 'urgent' && (
                                <span className="badge urgent">Priority</span>
                              )}
                              {v.subQueue === 'review' && <span className="badge review">📋 Doctor Review</span>}
                              {v.subQueue === 'walkin' && !v.isClinicalEmergency && !v.patient.hasDisability && (
                                <span className="badge">Routine Walk-in</span>
                              )}
                            </td>
                            <td>
                              <div style={{ display: 'flex', gap: '8px' }}>
                                <button
                                  className="text-link"
                                  onClick={() => {
                                    setSelectedVisitId(v.id);
                                    setActiveTab('patientView');
                                  }}
                                >
                                  {lang === 'ne' ? 'बिरामी यात्रा →' : 'Journey →'}
                                </button>
                                <button
                                  className="text-link"
                                  onClick={() => {
                                    setSelectedVisitId(v.id);
                                    setActiveTab('ticket');
                                  }}
                                >
                                  🖨️
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* VIEW: PATIENT / PERSONAL PATIENT DASHBOARD */}
              {activeTab === 'patientView' && (
                <PatientDashboard
                  visits={todayVisits}
                  departments={store.departments}
                  lang={lang}
                  t={t}
                  initialVisitId={selectedVisitId}
                  onPrintTicket={(visit) => {
                    setSelectedVisitId(visit.id);
                    setActiveTab('ticket');
                  }}
                  speakAnnouncement={speakAnnouncement}
                  getWaitMinutes={getWaitMinutes}
                />
              )}

              {/* VIEW: REGISTRATION / INTAKE */}
              {activeTab === 'register' && (
                <RegisterForm
                  departments={store.departments.filter((d) => d.isOpen)}
                  patients={store.patients}
                  lang={lang}
                  t={t}
                  onSubmit={handleRegisterVisit}
                />
              )}

              {/* VIEW: DOCTOR'S DESK */}
              {activeTab === 'doctorDesk' && (
                <DoctorDesk
                  departments={store.departments}
                  selectedDeptId={selectedDoctorDeptId}
                  onSelectDeptId={setSelectedDoctorDeptId}
                  visits={todayVisits}
                  counters={store.counters}
                  lang={lang}
                  t={t}
                  onCallNext={handleCallNext}
                  onStartService={handleStartService}
                  onCompleteOrOrder={handleDoctorCompleteOrOrder}
                  onMarkAbsent={handleAbsence}
                  onOverride={handleClinicalOverride}
                />
              )}

              {/* VIEW: BILLING & BIMA DESK */}
              {activeTab === 'billingDesk' && (
                <BillingDesk
                  visits={todayVisits}
                  lang={lang}
                  t={t}
                  onClearBilling={handleClearBilling}
                />
              )}

              {/* VIEW: LAB DESK */}
              {activeTab === 'labDesk' && (
                <LabDesk
                  visits={todayVisits}
                  lang={lang}
                  t={t}
                  onCollectSpecimen={handleCollectSpecimen}
                  onMarkReportReady={handleMarkReportReady}
                />
              )}

              {/* VIEW: RADIOLOGY DESK */}
              {activeTab === 'radiologyDesk' && (
                <RadiologyDesk
                  visits={todayVisits}
                  lang={lang}
                  t={t}
                  onMarkReportReady={handleMarkReportReady}
                />
              )}

              {/* VIEW: PHARMACY DESK */}
              {activeTab === 'pharmacyDesk' && (
                <PharmacyDesk
                  visits={todayVisits}
                  lang={lang}
                  t={t}
                  onDispense={handlePharmacyDispense}
                />
              )}

              {/* VIEW: ADMIN OPERATIONS & KPIS */}
              {activeTab === 'adminKpis' && (
                <AdminDesk
                  departments={store.departments}
                  visits={todayVisits}
                  auditEvents={store.auditEvents}
                  lang={lang}
                  t={t}
                  onToggleDept={(id: number) => {
                    setStore((prev) => ({
                      ...prev,
                      departments: prev.departments.map((d) => (d.id === id ? { ...d, isOpen: !d.isOpen } : d)),
                    }));
                  }}
                />
              )}

              {/* VIEW: AUDIT LOG */}
              {activeTab === 'activity' && (
                <div>
                  <div className="page-heading">
                    <div>
                      <p className="eyebrow">{lang === 'ne' ? 'कार्य विवरण लग' : 'AUDIT EVENT LOG'}</p>
                      <h1>{lang === 'ne' ? 'अस्पताल सञ्चालन लग (Immutable Audit)' : 'System Audit Trail'}</h1>
                      <p className="muted">
                        {lang === 'ne'
                          ? 'प्रत्येक पालो आह्वान, परिचय पुष्टि र प्राथमिकता परिवर्तनको समयबद्ध रेकर्ड।'
                          : 'Timestamped ledger of every queue call, state transition, and emergency override.'}
                      </p>
                    </div>
                  </div>

                  <div className="panel table-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>Time</th>
                          <th>Token</th>
                          <th>Staff Actor</th>
                          <th>Action</th>
                          <th>Reason / Note</th>
                        </tr>
                      </thead>
                      <tbody>
                        {store.auditEvents.slice(0, 100).map((e) => (
                          <tr key={e.id}>
                            <td>
                              {new Date(e.createdAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                            </td>
                            <td><span className="token-chip">{e.visitToken}</span></td>
                            <td><b>{e.actor}</b></td>
                            <td>{e.action}</td>
                            <td>{e.reason || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </main>

            <footer className="footer">
              <div>
                <b>{t.brandName}</b> · {t.hospitalName} <span>{t.ticket.clinicalWarning}</span>
              </div>
              <div>Bilingual Platform · 14 Nepali OPD Specialties</div>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
}

// -------------------------------------------------------------
// SUBCOMPONENTS
// -------------------------------------------------------------

function RegisterForm({
  departments,
  patients,
  lang,
  t,
  onSubmit,
}: {
  departments: Department[];
  patients: Patient[];
  lang: Language;
  t: any;
  onSubmit: (data: any) => void;
}) {
  const [search, setSearch] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  const [name, setName] = useState('');
  const [hospitalId, setHospitalId] = useState('');
  const [bimaNumber, setBimaNumber] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('Female');
  const [phone, setPhone] = useState('');
  const [departmentId, setDepartmentId] = useState(1);
  const [isSenior, setIsSenior] = useState(false);
  const [hasDisability, setHasDisability] = useState(false);
  const [isPregnant, setIsPregnant] = useState(false);
  const [isEmergency, setIsEmergency] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('all');

  const opdDepartments = useMemo(() => {
    return departments.filter((d) => d.type === 'opd');
  }, [departments]);

  const filteredOpd = useMemo(() => {
    if (categoryFilter === 'all') return opdDepartments;
    return opdDepartments.filter((d) => d.category === categoryFilter);
  }, [opdDepartments, categoryFilter]);

  const searchResults = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return [];
    return patients.filter((p) => p.name.toLowerCase().includes(q) || (p.hospitalId && p.hospitalId.toLowerCase().includes(q)));
  }, [patients, search]);

  const handleSelect = (p: Patient) => {
    setSelectedPatient(p);
    setName(p.name);
    setHospitalId(p.hospitalId || '');
    setBimaNumber(p.bimaNumber || '');
    setAge(p.age ? String(p.age) : '');
    setGender(p.gender || 'Female');
    setPhone(p.phone || '');
    setIsSenior(!!p.isSenior);
    setHasDisability(!!p.hasDisability);
    setIsPregnant(!!p.isPregnant);
    setIsEmergency(false);
  };

  const handleClear = () => {
    setSelectedPatient(null);
    setName('');
    setHospitalId('');
    setBimaNumber('');
    setAge('');
    setPhone('');
    setIsSenior(false);
    setHasDisability(false);
    setIsPregnant(false);
    setIsEmergency(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      existingPatientId: selectedPatient?.id,
      name,
      hospitalId,
      bimaNumber,
      age,
      gender,
      phone,
      departmentId,
      isSenior,
      hasDisability,
      isPregnant,
      isEmergency,
      confirmed,
    });
  };

  const selectedDeptObj = departments.find((d) => d.id === departmentId);

  return (
    <div>
      <div className="page-heading">
        <div>
          <p className="eyebrow">{lang === 'ne' ? 'दर्ता तथा इन्टेक' : 'RECEPTION / INTAKE'}</p>
          <h1>{lang === 'ne' ? 'नयाँ बिरामी दर्ता (१४ विशेषज्ञ ओपिडी सेवाहरू)' : 'Patient Registration (14 OPD Specialties)'}</h1>
          <p className="muted">
            {lang === 'ne'
              ? 'बिरामीको लक्षण अनुसार सही विशेषज्ञ सेवा छान्नुहोस् र टोकन जारी गर्नुहोस्।'
              : 'Select from 14 standard hospital specialties and issue a unified visit token slip.'}
          </p>
        </div>
      </div>

      <div className="two-col">
        <section className="panel padded">
          <span className="step-number">01</span>
          <h2>{lang === 'ne' ? 'पुराना बिरामी खोज्नुहोस्' : 'Check Existing Patients'}</h2>
          <div className="search-form">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="e.g. Maya, Ram or DEMO-001"
            />
          </div>

          {search && (
            <div className="search-results">
              {searchResults.map((p) => (
                <div key={p.id} onClick={() => handleSelect(p)}>
                  <span>
                    <b>{p.name}</b>
                    <small>{p.hospitalId} · {p.bimaNumber ? `बीमा: ${p.bimaNumber}` : 'Cash'} · {p.age || '—'} yrs</small>
                  </span>
                  <span className="text-link">{lang === 'ne' ? 'छान्नुहोस् →' : 'Select →'}</span>
                </div>
              ))}
              {searchResults.length === 0 && (
                <p className="empty">{lang === 'ne' ? 'कुनै रेकर्ड भेटिएन। नयाँ बिरामी दर्ता गर्नुहोस्।' : 'No matching record. Register as new.'}</p>
              )}
            </div>
          )}

          <div className="hint">
            <b>{lang === 'ne' ? '१४ वटा ओपिडी विशेषज्ञ सेवाहरू उपलब्ध' : '14 Specialty OPD Services Available'}</b>
            <p style={{ fontSize: '12px' }}>
              {lang === 'ne'
                ? 'मुटु, शल्यक्रिया, प्रसूति, बालरोग, हाडजोर्नी, नाक-कान-घाँटी, छाला, मानसिक, पेट-कलेजो, छाती, नसा, मूत्ररोग, दाँत, तथा आँखा।'
                : 'Cardiology, Surgery, OB-GYN, Pediatrics, Orthopedics, ENT, Dermatology, Psychiatry, Gastro, Pulmonology, Neurology, Urology, Dental, and Eye.'}
            </p>
          </div>
        </section>

        <section className="panel padded">
          <span className="step-number">02</span>
          <h2>{selectedPatient ? `Visit for ${selectedPatient.name}` : (lang === 'ne' ? 'नयाँ बिरामी दर्ता' : 'Patient Registration')}</h2>

          {selectedPatient && (
            <div className="notice">
              {lang === 'ne' ? 'पुराना बिरामी छानिएको छ:' : 'Using existing patient:'} <b>{selectedPatient.name}</b> ({selectedPatient.hospitalId})
              <br />
              <button type="button" className="text-link" onClick={handleClear}>{lang === 'ne' ? 'नयाँ बिरामी दर्ता गर्नुहोस्' : 'Clear & New'}</button>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {!selectedPatient && (
              <>
                <label>{lang === 'ne' ? 'बिरामीको पूरा नाम *' : 'Full Name *'}</label>
                <input required type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Maya Tamang" />

                <div className="field-row">
                  <div>
                    <label>{lang === 'ne' ? 'अस्पताल दर्ता नं. (ऐच्छिक)' : 'Hospital ID / MRN (opt)'}</label>
                    <input type="text" value={hospitalId} onChange={(e) => setHospitalId(e.target.value)} placeholder="e.g. DEMO-008" />
                  </div>
                  <div>
                    <label>{lang === 'ne' ? 'स्वास्थ्य बीमा नं. (यदि छ भने)' : 'Bima Number (opt)'}</label>
                    <input type="text" value={bimaNumber} onChange={(e) => setBimaNumber(e.target.value)} placeholder="e.g. BIMA-12345" />
                  </div>
                </div>

                <div className="field-row">
                  <div>
                    <label>{lang === 'ne' ? 'उमेर (वर्ष)' : 'Age (Years)'}</label>
                    <input type="number" value={age} onChange={(e) => setAge(e.target.value)} placeholder="34" />
                  </div>
                  <div>
                    <label>{lang === 'ne' ? 'लिङ्ग' : 'Gender'}</label>
                    <select value={gender} onChange={(e) => setGender(e.target.value)}>
                      <option value="Female">Female / महिला</option>
                      <option value="Male">Male / पुरुष</option>
                      <option value="Other">Other / अन्य</option>
                    </select>
                  </div>
                </div>

                <label>{lang === 'ne' ? 'सम्पर्क फोन नम्बर (ऐच्छिक)' : 'Phone Number (opt)'}</label>
                <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="98XXXXXXXX" />
              </>
            )}

            {/* Specialty Selection with Category Pills */}
            <div style={{ marginTop: '16px' }}>
              <label>{lang === 'ne' ? 'गन्तव्य ओपिडी विशेषज्ञ सेवा (Destination OPD Specialty) *' : 'Destination OPD Specialty *'}</label>
              
              <div style={{ display: 'flex', gap: '6px', marginBottom: '8px', flexWrap: 'wrap' }}>
                <button type="button" className={`button ${categoryFilter === 'all' ? '' : 'secondary'}`} style={{ minHeight: '26px', padding: '2px 8px', fontSize: '11px' }} onClick={() => setCategoryFilter('all')}>
                  {lang === 'ne' ? 'सबै' : 'All'}
                </button>
                <button type="button" className={`button ${categoryFilter === 'general' ? '' : 'secondary'}`} style={{ minHeight: '26px', padding: '2px 8px', fontSize: '11px' }} onClick={() => setCategoryFilter('general')}>
                  {lang === 'ne' ? 'मेडिसिन' : 'Medicine'}
                </button>
                <button type="button" className={`button ${categoryFilter === 'maternal_child' ? '' : 'secondary'}`} style={{ minHeight: '26px', padding: '2px 8px', fontSize: '11px' }} onClick={() => setCategoryFilter('maternal_child')}>
                  {lang === 'ne' ? 'प्रसूति तथा बालरोग' : 'Maternal & Child'}
                </button>
                <button type="button" className={`button ${categoryFilter === 'surgical' ? '' : 'secondary'}`} style={{ minHeight: '26px', padding: '2px 8px', fontSize: '11px' }} onClick={() => setCategoryFilter('surgical')}>
                  {lang === 'ne' ? 'सर्जरी/हाडजोर्नी' : 'Surgical & Ortho'}
                </button>
                <button type="button" className={`button ${categoryFilter === 'specialty' ? '' : 'secondary'}`} style={{ minHeight: '26px', padding: '2px 8px', fontSize: '11px' }} onClick={() => setCategoryFilter('specialty')}>
                  {lang === 'ne' ? 'विशेषज्ञ सेवाहरू' : 'Specialties'}
                </button>
              </div>

              <select value={departmentId} onChange={(e) => setDepartmentId(Number(e.target.value))}>
                {filteredOpd.map((d) => (
                  <option key={d.id} value={d.id}>
                    {lang === 'ne' ? d.nameNe : d.name} — {lang === 'ne' ? d.locationNe : d.location}
                  </option>
                ))}
              </select>

              {selectedDeptObj && selectedDeptObj.description && (
                <div style={{ background: '#f5f8f6', border: '1px solid #d8e5dd', borderRadius: '6px', padding: '8px 12px', marginTop: '6px', fontSize: '12px' }}>
                  <b>ℹ️ {lang === 'ne' ? 'सेवा विवरण:' : 'Clinical Scope:'}</b> {lang === 'ne' ? selectedDeptObj.descriptionNe : selectedDeptObj.description}
                </div>
              )}
            </div>

            <div style={{ margin: '18px 0', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '14px', background: '#fafbfc' }}>
              <span style={{ display: 'block', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: '#475569', marginBottom: '8px', letterSpacing: '0.5px' }}>
                {lang === 'ne' ? 'विशेष प्राथमिकता तथा पहुँच सुविधा (Priority & Accessibility)' : 'Priority & Accessibility Accommodations'}
              </span>

              {/* 1. Emergency Option */}
              <div style={{
                border: isEmergency ? '2px solid #ef4444' : '1px solid #fecaca',
                borderRadius: '6px',
                padding: '10px 12px',
                marginBottom: '10px',
                background: isEmergency ? '#fef2f2' : '#fff'
              }}>
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', cursor: 'pointer', margin: 0 }}>
                  <input
                    type="checkbox"
                    checked={isEmergency}
                    onChange={(e) => setIsEmergency(e.target.checked)}
                    style={{ marginTop: '3px' }}
                  />
                  <div>
                    <b style={{ color: '#b91c1c', fontSize: '13.5px' }}>
                      🚨 {lang === 'ne' ? 'आकस्मिक बिरामी (Emergency / Acute Triage)' : 'Emergency / Acute Triage Priority'}
                    </b>
                    <small style={{ display: 'block', color: '#7f1d1d', marginTop: '2px', fontSize: '11.5px' }}>
                      {lang === 'ne'
                        ? 'गम्भीर दुखाइ, सास फेर्न गाह्रो वा तत्काल डाक्टरको हेरचाह चाहिने बिरामी। (पालो सूचीमा शीर्ष स्थानमा राखिनेछ)'
                        : 'Severe pain, acute shortness of breath, or unstable vitals. Auto-escalates token to Urgent top of queue.'}
                    </small>
                  </div>
                </label>
              </div>

              {/* 2. Physically Disabled Person Option */}
              <div style={{
                border: hasDisability ? '2px solid #2563eb' : '1px solid #bfdbfe',
                borderRadius: '6px',
                padding: '10px 12px',
                marginBottom: '10px',
                background: hasDisability ? '#eff6ff' : '#fff'
              }}>
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', cursor: 'pointer', margin: 0 }}>
                  <input
                    type="checkbox"
                    checked={hasDisability}
                    onChange={(e) => setHasDisability(e.target.checked)}
                    style={{ marginTop: '3px' }}
                  />
                  <div>
                    <b style={{ color: '#1d4ed8', fontSize: '13.5px' }}>
                      ♿ {lang === 'ne' ? 'अपाङ्गता भएका व्यक्ति (Physically Disabled Person)' : 'Physically Disabled Person (Accessibility Accommodation)'}
                    </b>
                    <small style={{ display: 'block', color: '#1e3a8a', marginTop: '2px', fontSize: '11.5px' }}>
                      {lang === 'ne'
                        ? 'ह्विलचेयर सहायता, भुइँतल्लाको कोठा तथा विशेष प्राथमिकता पालो सुविधा उपलब्ध गराइनेछ।'
                        : 'Wheelchair assistance, accessible ground floor consultation room, and expedited priority queue line.'}
                    </small>
                  </div>
                </label>
              </div>

              {/* 3. Senior Citizen & Pregnant Woman Options */}
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', paddingTop: '4px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer' }}>
                  <input type="checkbox" checked={isSenior} onChange={(e) => setIsSenior(e.target.checked)} />
                  <span>👴 {lang === 'ne' ? 'ज्येष्ठ नागरिक (६५+)' : 'Senior Citizen (65+)'}</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer' }}>
                  <input type="checkbox" checked={isPregnant} onChange={(e) => setIsPregnant(e.target.checked)} />
                  <span>🤰 {lang === 'ne' ? 'गर्भवती महिला' : 'Pregnant Woman'}</span>
                </label>
              </div>

              {(isEmergency || hasDisability) && (
                <div style={{
                  marginTop: '10px',
                  padding: '6px 10px',
                  borderRadius: '4px',
                  background: isEmergency ? '#fee2e2' : '#dbeafe',
                  color: isEmergency ? '#991b1b' : '#1e40af',
                  fontSize: '11.5px',
                  fontWeight: 600
                }}>
                  {isEmergency
                    ? (lang === 'ne' ? '⚠️ यो टोकन आकस्मिक (Urgent) श्रेणीमा जारी हुनेछ र डाक्टर डेस्कमा तुरुन्तै सूचित हुनेछ।' : '⚠️ This token will be marked Urgent Triage and escalated to the doctor desk immediately.')
                    : (lang === 'ne' ? 'ℹ️ अपाङ्गता प्राथमिकता सुरक्षित गरियो। सहायता डेस्क सूचित गरियो।' : 'ℹ️ Accessibility accommodation activated for this visit.')}
                </div>
              )}
            </div>

            <label className="check-label">
              <input type="checkbox" required checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} />
              <span>{lang === 'ne' ? 'मैले परिचय तथा दोहोरिएको रेकर्ड प्रमाणीकरण गरेँ।' : 'I verified the identity and duplicate checks.'}</span>
            </label>

            <button type="submit" className="button wide">
              {lang === 'ne' ? 'टोकन जारी गर्नुहोस् →' : 'Issue Token & Print Slip →'}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}

function DoctorDesk({
  departments,
  selectedDeptId,
  onSelectDeptId,
  visits,
  counters,
  lang,
  t,
  onCallNext,
  onStartService,
  onCompleteOrOrder,
  onMarkAbsent,
  onOverride,
}: any) {
  const currentDept = departments.find((d: Department) => d.id === selectedDeptId) || departments[0];
  const deptCounters = counters.filter((c: Counter) => c.departmentId === currentDept.id);
  const activeCounter = deptCounters[0] || { id: currentDept.id, name: currentDept.name, nameNe: currentDept.nameNe, isOpen: true };

  const opdVisits = visits.filter((v: Visit) => v.departmentId === currentDept.id || (v.subQueue === 'review' && v.departmentId === currentDept.id));
  const activeCall = opdVisits.find((v: Visit) => (v.status === 'called' || v.status === 'in_service'));
  
  const reviewPatients = opdVisits.filter((v: Visit) => v.subQueue === 'review' && v.status === 'waiting');
  const waitingPatients = opdVisits.filter((v: Visit) => v.subQueue !== 'review' && v.status === 'waiting');

  const [orderLab, setOrderLab] = useState(false);
  const [orderXray, setOrderXray] = useState(false);
  const [prescription, setPrescription] = useState('');
  const [absenceReason, setAbsenceReason] = useState('');

  const calculateWait = (queuedAtStr: string) => {
    return Math.max(0, Math.floor((Date.now() - new Date(queuedAtStr).getTime()) / 60000));
  };

  return (
    <div>
      <div className="page-heading">
        <div>
          <p className="eyebrow">{lang === 'ne' ? 'ओपिडी डाक्टर कक्ष' : 'OPD CLINICAL CONSULTATION'}</p>
          <h1>
            {lang === 'ne' ? currentDept.nameNe : currentDept.name} ({lang === 'ne' ? currentDept.locationNe : currentDept.location})
          </h1>
          <p className="muted">
            {reviewPatients.length} {lang === 'ne' ? 'रिपोर्ट रिभ्यु' : 'review patients'} · {waitingPatients.length} {lang === 'ne' ? 'नयाँ बिरामी' : 'new walk-ins'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Specialty Room Switcher for Doctor */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#fff', padding: '4px 8px', borderRadius: '8px', border: '1px solid var(--line)' }}>
            <span style={{ fontSize: '12px', fontWeight: 700 }}>{lang === 'ne' ? 'ओपिडी कोठा:' : 'OPD Room:'}</span>
            <select
              value={selectedDeptId}
              onChange={(e) => onSelectDeptId(Number(e.target.value))}
              style={{ minHeight: '32px', fontSize: '12px' }}
            >
              {departments.filter((d: Department) => d.type === 'opd').map((d: Department) => (
                <option key={d.id} value={d.id}>
                  {lang === 'ne' ? d.nameNe : d.name} ({lang === 'ne' ? d.locationNe : d.location})
                </option>
              ))}
            </select>
          </div>

          <button
            className="button"
            disabled={!!activeCall}
            onClick={() => onCallNext(activeCounter.id)}
          >
            🔔 {t.actions.callNext}
          </button>
        </div>
      </div>

      <div className="two-col">
        <div>
          <section className="panel padded">
            <h2>{lang === 'ne' ? 'हाल बोलाइएको / सेवा लिइरहेको बिरामी' : 'Current Active Patient'}</h2>

            {activeCall ? (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div className="call-token" style={{ color: 'var(--teal)' }}>{activeCall.token}</div>
                    <h3 style={{ margin: '4px 0' }}>{activeCall.patient.name}</h3>
                    <p className="muted">
                      {activeCall.patient.hospitalId} · Age {activeCall.patient.age || '—'} · {activeCall.patient.gender}
                    </p>
                    <div style={{ display: 'flex', gap: '6px', marginTop: '4px', flexWrap: 'wrap' }}>
                      {activeCall.isClinicalEmergency && <span className="badge urgent">🚨 Emergency</span>}
                      {activeCall.patient.hasDisability && (
                        <span className="badge" style={{ background: '#dbeafe', color: '#1e40af', border: '1px solid #93c5fd' }}>
                          ♿ Disabled (Accessibility)
                        </span>
                      )}
                      {activeCall.patient.isSenior && <span className="badge" style={{ background: '#fef3c7', color: '#92400e' }}>👴 65+ Senior</span>}
                      {activeCall.patient.isPregnant && <span className="badge" style={{ background: '#fce7f3', color: '#9d174d' }}>🤰 Pregnant</span>}
                    </div>
                  </div>
                  <span className={`badge ${activeCall.status}`}>{activeCall.status.toUpperCase()}</span>
                </div>

                {activeCall.subQueue === 'review' && (
                  <div className="notice" style={{ background: '#e0e7ff', color: '#1e1b4b', marginTop: '10px' }}>
                    <b>📋 {lang === 'ne' ? 'रिपोर्ट रिभ्यु (Lab Report Ready):' : 'Doctor Review - Lab Reports Ready:'}</b>
                    <ul style={{ margin: '6px 0 0 16px', padding: 0 }}>
                      {activeCall.orders.map((o: ClinicalOrder) => (
                        <li key={o.id}>{lang === 'ne' ? o.testNameNe : o.testNameEn} — <b style={{ color: '#047857' }}>READY</b></li>
                      ))}
                    </ul>
                  </div>
                )}

                {activeCall.status === 'called' && (
                  <div style={{ marginTop: '20px' }}>
                    <div className="notice warning">
                      {lang === 'ne' ? 'कृपया बिरामीको परिचय जाँच गरी सेवा सुरु गर्नुहोस्।' : 'Please confirm patient presence and identity.'}
                    </div>
                    <button className="button wide" onClick={() => onStartService(activeCall.id)}>
                      {t.actions.startService}
                    </button>

                    <div style={{ marginTop: '14px', display: 'flex', gap: '8px' }}>
                      <input
                        type="text"
                        value={absenceReason}
                        onChange={(e) => setAbsenceReason(e.target.value)}
                        placeholder="Absence reason (e.g. called twice)"
                        style={{ minHeight: '36px' }}
                      />
                      <button className="button danger" onClick={() => onMarkAbsent(activeCall.id, absenceReason)}>
                        {t.actions.markAbsent}
                      </button>
                    </div>
                  </div>
                )}

                {activeCall.status === 'in_service' && (
                  <div style={{ marginTop: '20px', borderTop: '1px solid var(--line)', paddingTop: '16px' }}>
                    <h4>{lang === 'ne' ? 'जाँच तथा अर्को गन्तव्य सिफारिस (Order Investigations):' : 'Order Investigations / Prescribe:'}</h4>

                    <div style={{ display: 'grid', gap: '8px', margin: '12px 0' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input type="checkbox" checked={orderLab} onChange={(e) => setOrderLab(e.target.checked)} />
                        <span>🧪 <b>Pathology Lab</b> (Blood / Urine Specimen)</span>
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input type="checkbox" checked={orderXray} onChange={(e) => setOrderXray(e.target.checked)} />
                        <span>🩻 <b>Radiology</b> (Digital X-Ray / USG)</span>
                      </label>
                    </div>

                    <label>{lang === 'ne' ? 'औषधि सिफारिस (Prescription):' : 'Prescription Notes:'}</label>
                    <textarea
                      rows={2}
                      value={prescription}
                      onChange={(e) => setPrescription(e.target.value)}
                      placeholder="e.g. Paracetamol 500mg, Azithromycin 500mg..."
                    />

                    <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
                      <button
                        className="button wide"
                        onClick={() => {
                          onCompleteOrOrder(activeCall.id, { orderLab, orderXray, prescription });
                          setOrderLab(false);
                          setOrderXray(false);
                          setPrescription('');
                        }}
                      >
                        {orderLab || orderXray ? t.actions.orderInvestigation : t.actions.completeConsultation}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="empty">
                <div className="idle-icon">👨‍⚕️</div>
                <p>{lang === 'ne' ? 'काउन्टर खाली छ। "अर्को बिरामी बोलाउनुहोस्" थिच्नुहोस्।' : 'Counter available. Click "Call Next Patient" to welcome the next turn.'}</p>
              </div>
            )}
          </section>
        </div>

        <div>
          {reviewPatients.length > 0 && (
            <div className="panel padded" style={{ marginBottom: '20px', borderLeft: '4px solid #4338ca' }}>
              <h3 style={{ color: '#4338ca' }}>📋 {lang === 'ne' ? 'रिपोर्ट रिभ्यु सूची (Doctor Review Queue)' : 'Report Review Queue'}</h3>
              <p className="tiny muted">{lang === 'ne' ? 'यी बिरामीहरूको जाँच सम्पन्न भइसकेको छ।' : 'Tests complete. Interleaved with priority into OPD.'}</p>
              {reviewPatients.map((v: Visit) => (
                <div key={v.id} className="list-row">
                  <div>
                    <span className="token-chip" style={{ background: '#e0e7ff', color: '#312e81' }}>{v.token}</span>
                    <b style={{ marginLeft: '8px' }}>{v.patient.name}</b>
                  </div>
                  <span className="badge review">Ready for Review</span>
                </div>
              ))}
            </div>
          )}

          <div className="panel padded">
            <h3>{lang === 'ne' ? `${currentDept.nameNe} पालो सूची` : `${currentDept.name} Waiting List`}</h3>
            {waitingPatients.map((v: Visit) => (
              <div key={v.id} className="list-row">
                <div>
                  <span className="token-chip">{v.token}</span>
                  <b style={{ marginLeft: '8px' }}>{v.patient.name}</b>
                  {v.isClinicalEmergency && <span className="badge urgent" style={{ marginLeft: '6px' }}>🚨 Emergency</span>}
                  {v.patient.hasDisability && (
                    <span className="badge" style={{ background: '#dbeafe', color: '#1e40af', border: '1px solid #93c5fd', marginLeft: '6px' }}>
                      ♿ Disabled
                    </span>
                  )}
                  {!v.isClinicalEmergency && !v.patient.hasDisability && v.subQueue === 'urgent' && (
                    <span className="badge urgent" style={{ marginLeft: '6px' }}>Urgent</span>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="text-link" onClick={() => onOverride(v.id)} title="Flag Urgent Clinical Override">
                    🚨
                  </button>
                  <span className="tiny muted">{calculateWait(v.queuedAt)} min</span>
                </div>
              </div>
            ))}
            {waitingPatients.length === 0 && (
              <p className="empty">{lang === 'ne' ? 'सबै बिरामीको सेवा सम्पन्न भयो।' : 'Queue is clear.'}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function BillingDesk({ visits, lang, t, onClearBilling }: any) {
  const billingVisits = visits.filter((v: Visit) => v.department.type === 'billing' || (v.orders.length > 0 && v.orders.some((o: ClinicalOrder) => !o.isPaid)));
  const [receiptNo, setReceiptNo] = useState('');
  const [payType, setPayType] = useState<PaymentStatus>('cash_paid');

  return (
    <div>
      <div className="page-heading">
        <div>
          <p className="eyebrow">{lang === 'ne' ? 'काउन्टर ०२' : 'BILLING & BIMA CLEARANCE'}</p>
          <h1>{lang === 'ne' ? 'बिलिङ तथा स्वास्थ्य बीमा डेस्क' : 'Cashier & Insurance Counter'}</h1>
          <p className="muted">{lang === 'ne' ? 'रकम भुक्तानी वा बीमा प्रमाणित गरी जाँच अनुमति दिनुहोस्।' : 'Verify payment or health insurance approval to unlock diagnostic testing.'}</p>
        </div>
      </div>

      <div className="panel table-wrap">
        <table>
          <thead>
            <tr>
              <th>Token</th>
              <th>Patient</th>
              <th>Ordered Tests</th>
              <th>Billing Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {billingVisits.map((v: Visit) => (
              <tr key={v.id}>
                <td><span className="token-chip">{v.token}</span></td>
                <td>
                  <b>{v.patient.name}</b>
                  <small className="block muted">{v.patient.bimaNumber ? `Bima: ${v.patient.bimaNumber}` : 'Cash Patient'}</small>
                </td>
                <td>
                  {v.orders.map((o: ClinicalOrder) => (
                    <span key={o.id} className="badge" style={{ marginRight: '4px' }}>
                      {lang === 'ne' ? o.testNameNe : o.testNameEn}
                    </span>
                  ))}
                </td>
                <td>
                  {v.orders.every((o: ClinicalOrder) => o.isPaid) ? (
                    <span className="badge completed">✓ Cleared</span>
                  ) : (
                    <span className="badge absent">Pending Payment</span>
                  )}
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <select
                      value={payType}
                      onChange={(e) => setPayType(e.target.value as PaymentStatus)}
                      style={{ minHeight: '34px', fontSize: '12px' }}
                    >
                      <option value="cash_paid">Cash (नगद)</option>
                      <option value="bima_verified">Bima (स्वास्थ्य बीमा)</option>
                      <option value="exempt_poor_fund">Poor Fund Exemption (छुट)</option>
                    </select>
                    <input
                      type="text"
                      placeholder="Receipt #"
                      value={receiptNo}
                      onChange={(e) => setReceiptNo(e.target.value)}
                      style={{ minHeight: '34px', width: '100px', fontSize: '12px' }}
                    />
                    <button
                      className="button"
                      style={{ minHeight: '34px', padding: '6px 12px', fontSize: '12px' }}
                      onClick={() => onClearBilling(v.id, payType, receiptNo)}
                    >
                      ✓ {lang === 'ne' ? 'स्वीकृत' : 'Verify'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {billingVisits.length === 0 && (
              <tr><td colSpan={5} className="empty">{lang === 'ne' ? 'बिलिङ बाँकी कुनै बिरामी छैनन्।' : 'No patients awaiting billing.'}</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function LabDesk({ visits, lang, t, onCollectSpecimen, onMarkReportReady }: any) {
  const labVisits = visits.filter((v: Visit) => v.department.type === 'lab' || v.orders.some((o: ClinicalOrder) => o.category === 'lab'));

  return (
    <div>
      <div className="page-heading">
        <div>
          <p className="eyebrow">{lang === 'ne' ? 'कोठा नं. १२' : 'PATHOLOGY LABORATORY'}</p>
          <h1>{lang === 'ne' ? 'प्रयोगशाला तथा रगत संकलन डेस्क' : 'Laboratory & Phlebotomy'}</h1>
          <p className="muted">{lang === 'ne' ? 'नमुना संकलन गर्नुहोस् र रिपोर्ट तयार भएपछि प्रमाणित गर्नुहोस्।' : 'Track blood/urine collection and batch verify completed diagnostic reports.'}</p>
        </div>
      </div>

      <div className="panel table-wrap">
        <table>
          <thead>
            <tr>
              <th>Token</th>
              <th>Patient</th>
              <th>Lab Tests Ordered</th>
              <th>Billing Clearance</th>
              <th>Specimen Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {labVisits.map((v: Visit) => {
              const labOrders = v.orders.filter((o: ClinicalOrder) => o.category === 'lab');
              const isCleared = labOrders.every((o: ClinicalOrder) => o.isPaid);
              const isCollected = labOrders.some((o: ClinicalOrder) => o.specimenStatus === 'collected' || o.specimenStatus === 'ready');
              const isReady = labOrders.every((o: ClinicalOrder) => o.isReportReady);

              return (
                <tr key={v.id}>
                  <td><span className="token-chip">{v.token}</span></td>
                  <td><b>{v.patient.name}</b></td>
                  <td>
                    {labOrders.map((o: ClinicalOrder) => (
                      <div key={o.id} style={{ fontSize: '12px' }}>🧪 {lang === 'ne' ? o.testNameNe : o.testNameEn}</div>
                    ))}
                  </td>
                  <td>
                    <span className={`badge ${isCleared ? 'completed' : 'absent'}`}>
                      {isCleared ? 'Paid / Bima' : 'Unpaid'}
                    </span>
                  </td>
                  <td>
                    {isReady ? (
                      <span className="badge completed">Report Ready</span>
                    ) : isCollected ? (
                      <span className="badge in_service">Sample Collected</span>
                    ) : (
                      <span className="badge waiting">Awaiting Sample</span>
                    )}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {!isCollected && (
                        <button
                          className="button secondary"
                          disabled={!isCleared}
                          style={{ minHeight: '34px', padding: '6px 12px', fontSize: '12px' }}
                          onClick={() => onCollectSpecimen(v.id)}
                        >
                          🩸 {t.actions.collectSpecimen}
                        </button>
                      )}
                      {isCollected && !isReady && (
                        <button
                          className="button"
                          style={{ minHeight: '34px', padding: '6px 12px', fontSize: '12px' }}
                          onClick={() => onMarkReportReady(v.id)}
                        >
                          {t.actions.markReportReady}
                        </button>
                      )}
                      {isReady && <span className="tiny muted">✓ Sent to Doctor Review</span>}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function RadiologyDesk({ visits, lang, t, onMarkReportReady }: any) {
  const radVisits = visits.filter((v: Visit) => v.department.type === 'radiology' || v.orders.some((o: ClinicalOrder) => o.category === 'radiology'));

  return (
    <div>
      <div className="page-heading">
        <div>
          <p className="eyebrow">{lang === 'ne' ? 'कोठा नं. १५' : 'RADIOLOGY & IMAGING'}</p>
          <h1>{lang === 'ne' ? 'एक्स-रे तथा भिडियो एक्स-रे' : 'Radiology & X-Ray Unit'}</h1>
          <p className="muted">{lang === 'ne' ? 'एक्स-रे तथा अल्ट्रासाउन्ड सम्पन्न गरी रिपोर्ट तयार गर्नुहोस्।' : 'Execute scans and push completed imaging to Doctor Review.'}</p>
        </div>
      </div>

      <div className="panel table-wrap">
        <table>
          <thead>
            <tr>
              <th>Token</th>
              <th>Patient</th>
              <th>Imaging Order</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {radVisits.map((v: Visit) => {
              const radOrders = v.orders.filter((o: ClinicalOrder) => o.category === 'radiology');
              const isReady = radOrders.every((o: ClinicalOrder) => o.isReportReady);

              return (
                <tr key={v.id}>
                  <td><span className="token-chip">{v.token}</span></td>
                  <td><b>{v.patient.name}</b></td>
                  <td>
                    {radOrders.map((o: ClinicalOrder) => (
                      <div key={o.id}>🩻 {lang === 'ne' ? o.testNameNe : o.testNameEn}</div>
                    ))}
                  </td>
                  <td>
                    <span className={`badge ${isReady ? 'completed' : 'waiting'}`}>
                      {isReady ? 'Done' : 'Waiting for scan'}
                    </span>
                  </td>
                  <td>
                    {!isReady ? (
                      <button
                        className="button"
                        style={{ minHeight: '34px', padding: '6px 12px', fontSize: '12px' }}
                        onClick={() => onMarkReportReady(v.id)}
                      >
                        ✓ {t.actions.markReportReady}
                      </button>
                    ) : (
                      <span className="tiny muted">✓ Available on Doctor Screen</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PharmacyDesk({ visits, lang, t, onDispense }: any) {
  const rxVisits = visits.filter((v: Visit) => v.department.type === 'pharmacy' || v.prescriptionNotes);

  return (
    <div>
      <div className="page-heading">
        <div>
          <p className="eyebrow">{lang === 'ne' ? 'काउन्टर नं. ०५' : 'HOSPITAL PHARMACY'}</p>
          <h1>{lang === 'ne' ? 'औषधि वितरण डेस्क' : 'Pharmacy Dispensing'}</h1>
          <p className="muted">{lang === 'ne' ? 'सिफारिस गरिएका औषधिहरू दिई बिरामीको आजको यात्रा सम्पन्न गर्नुहोस्।' : 'Dispense verified prescription packages and complete final hospital visit.'}</p>
        </div>
      </div>

      <div className="panel table-wrap">
        <table>
          <thead>
            <tr>
              <th>Token</th>
              <th>Patient</th>
              <th>Prescribed Medications</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {rxVisits.map((v: Visit) => (
              <tr key={v.id}>
                <td><span className="token-chip">{v.token}</span></td>
                <td><b>{v.patient.name}</b></td>
                <td>
                  <div style={{ maxWidth: '300px', whiteSpace: 'normal', fontSize: '12.5px' }}>
                    💊 {v.prescriptionNotes || 'Standard Prescription Package'}
                  </div>
                </td>
                <td>
                  <span className={`badge ${v.status === 'completed' ? 'completed' : 'waiting'}`}>
                    {v.status === 'completed' ? 'Dispensed' : 'Ready to Dispense'}
                  </span>
                </td>
                <td>
                  {v.status !== 'completed' ? (
                    <button
                      className="button"
                      style={{ minHeight: '34px', padding: '6px 12px', fontSize: '12px' }}
                      onClick={() => onDispense(v.id)}
                    >
                      {t.actions.dispenseMedicine}
                    </button>
                  ) : (
                    <span className="tiny muted">✓ Visit Completed</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AdminDesk({ departments, visits, lang, t, onToggleDept }: any) {
  const waitTimes = visits.map((v: Visit) => {
    const qTime = new Date(v.queuedAt).getTime();
    return Math.floor((Date.now() - qTime) / 60000);
  });
  const medianWait = waitTimes.length > 0 ? waitTimes.sort((a: number, b: number) => a - b)[Math.floor(waitTimes.length / 2)] : 12;

  return (
    <div>
      <div className="page-heading">
        <div>
          <p className="eyebrow">{lang === 'ne' ? 'प्रशासन तथा नीति' : 'HOSPITAL ADMINISTRATION'}</p>
          <h1>{lang === 'ne' ? 'सञ्चालन सूचक तथा विभाग व्यवस्थापन' : 'Operational KPIs & Bottlenecks'}</h1>
          <p className="muted">{lang === 'ne' ? 'अस्पतालका पर्खाइ समय, विभाग खुला/बन्द स्थिति र नीतिगत अनुगमन।' : 'P50 wait metrics, capacity allocation, and emergency override audits.'}</p>
        </div>
      </div>

      <section className="stats">
        <article>
          <span>P50 Median Wait</span>
          <strong>{medianWait}m</strong>
          <small>Target: &lt; 20 min</small>
        </article>
        <article>
          <span>Peak Queue Window</span>
          <strong>09:30</strong>
          <small>Morning OPD Rush</small>
        </article>
        <article>
          <span>Active Departments</span>
          <strong>{departments.filter((d: Department) => d.isOpen).length} / {departments.length}</strong>
          <small>Operational</small>
        </article>
        <article>
          <span>Report Turnaround</span>
          <strong>35m</strong>
          <small>Lab specimen to review</small>
        </article>
      </section>

      <div className="section-heading">
        <h2>{lang === 'ne' ? 'विभाग नियन्त्रण (१८ विभागहरू)' : 'Department Operational Toggle (18 Departments)'}</h2>
      </div>

      <div className="panel padded">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
          {departments.map((d: Department) => (
            <div key={d.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', border: '1px solid var(--line)', borderRadius: '8px' }}>
              <div>
                <b>{lang === 'ne' ? d.nameNe : d.name}</b>
                <small className="block muted">📍 {lang === 'ne' ? d.locationNe : d.location}</small>
              </div>
              <button
                className={`button ${d.isOpen ? 'secondary' : ''}`}
                style={{ minHeight: '34px', padding: '4px 12px', fontSize: '12px' }}
                onClick={() => onToggleDept(d.id)}
              >
                {d.isOpen ? (lang === 'ne' ? 'बन्द गर्नुहोस्' : 'Pause') : (lang === 'ne' ? 'खोल्नुहोस्' : 'Re-open')}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default App;
