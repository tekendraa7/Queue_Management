# SmartQ (स्मार्टक्यु) — Patient Flow & Queue Coordination Platform

**Deploy-Ready Hospital Outpatient Platform with 14 Common OPD Specialties in Nepal**

SmartQ coordinates outpatient journeys across hospital specialties, diagnostics, billing, and pharmacy. It eliminates avoidable physical lines and doorway crowds through a unified visit token, bilingual (Nepali/English) patient wayfinding, public hallway TV boards, and automated doctor review re-entry.

---

## 1. Quick Start

The application runs on Vite with React 18 and TypeScript on port 3000:

```bash
npm install
npm run dev
```

Open **http://localhost:3000** to access the live system.

### Build & Verification
```bash
npm run build
npm run lint
```

---

## 2. 14 Common OPD Specialties Included

| # | Specialty Name (English) | नाम (नेपाली) | Token Prefix | Room / Location | Clinical Scope |
|---|---|---|---|---|---|
| 1 | **Internal Medicine & Cardiology** | इन्टर्नल मेडिसिन तथा मुटु रोग | `MED` | Ground Floor · Room 01 | General check-ups, heart disease management, hypertension & diabetes care. |
| 2 | **General & Laparoscopic Surgery** | जनरल तथा ल्याप्रोस्कोपिक शल्यक्रिया | `SUR` | 1st Floor · Room 02 | Surgical consultations, pre/post-operative care, and minor day-care procedures. |
| 3 | **Obstetrics & Gynecology (OB-GYN)** | प्रसूति तथा स्त्री रोग सेवा | `GYN` | Ground Floor · Room 03 | Prenatal & postnatal care, family planning, and women's reproductive health. |
| 4 | **Pediatrics & Child Health** | बालरोग तथा शिशु स्वास्थ्य | `PED` | Ground Floor · Room 05 | Child healthcare, growth monitoring, and routine immunizations. |
| 5 | **Orthopedics & Trauma Surgery** | हाडजोर्नी, नशा तथा ट्रमा सर्जरी | `ORT` | Ground Floor · Room 07 | Bone, joint, spine, ligament, and muscle treatment. |
| 6 | **Ear, Nose, and Throat (ENT - HNS)** | नाक, कान तथा घाँटी रोग | `ENT` | 1st Floor · Room 08 | Hearing/speech units, sinus, tonsils, and throat disorders. |
| 7 | **Dermatology & Venereology** | छाला, कपाल तथा यौन रोग | `DER` | 1st Floor · Room 09 | Skin allergies, spots, hair loss, and nail treatments. |
| 8 | **Psychiatry & Mental Health** | मानसिक स्वास्थ्य तथा मनोपरामर्श | `PSY` | 2nd Floor · Room 10 | Counseling, behavioral health, and psychiatric consultations. |
| 9 | **Gastroenterology & Hepatology** | पेट, आन्द्रा तथा कलेजो रोग | `GAS` | 1st Floor · Room 11 | Gastric, liver, jaundice, stomach, and digestive tract care. |
| 10 | **Pulmonology & Respiratory Care** | छाती, दम तथा श्वासप्रश्वास | `PUL` | 1st Floor · Room 13 | Cough, asthma, pneumonia, TB, and sleep-related breathing disorders. |
| 11 | **Neurology & Neurosurgery** | स्नायु, नशा तथा मस्तिष्क रोग | `NEU` | 2nd Floor · Room 14 | Brain, chronic headache, paralysis, epilepsy, and nerve evaluations. |
| 12 | **Urology & Nephrology** | मृगौला तथा मूत्ररोग | `URO` | 1st Floor · Room 16 | Kidney stones, prostate, bladder, and urinary tract treatments. |
| 13 | **Dental & Maxillofacial Services** | दन्तरोग तथा मुख स्वास्थ्य | `DEN` | Ground Floor · Room 17 | Oral health, scaling, extractions, fillings, and RCT. |
| 14 | **Ophthalmology (Eye Care)** | आँखा जाँच तथा उपचार | `EYE` | Ground Floor · Room 18 | Vision tests, cataracts, spectacles check-up, and eye condition check-ups. |

### Supporting Diagnostics & Operations
* 15. **Pathology Laboratory** (`LAB` · 1st Floor Room 12): Blood, urine, biochemistry, and specimen testing.
* 16. **Radiology & Imaging** (`RAD` · 1st Floor Room 15): Digital X-Rays, Ultrasound (USG), and scans.
* 17. **Billing & Bima Counter** (`BIL` · Ground Floor Counter 02): Cash payments and National Health Insurance (*Bima*) verification.
* 18. **Hospital Pharmacy** (`PHR` · Exit Lobby Counter 05): Prescription dispensing and medication counseling.

---

## 3. Bilingual Support (नेपाली / English)

* **Top Bar Toggle**: Switch between **`EN`** and **`नेपाली`** with one click.
* Every UI element, status chip, ticket slip, and audio announcement translates seamlessly.
* **Audio Voice Output**: Web speech synthesis reads token numbers aloud in Nepali (*"टोकन नम्बर MED-041, कोठा नम्बर १ मा आउनुहोस्"*).
