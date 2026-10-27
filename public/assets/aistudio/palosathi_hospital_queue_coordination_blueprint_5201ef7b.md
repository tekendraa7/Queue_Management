# PaloSathi (पालो साथी): Patient-Flow & Queue-Coordination Platform Blueprint for Nepal

---

## A. Executive Summary and Project Identity

### 1. Concise Solution Description
This project is a **local-first, paper-plus-digital patient journey and queue-coordination platform** designed for Nepali outpatient clinics and hospitals. Instead of issuing isolated, single-counter paper slips at every window, the system issues a **single Visit Token (printed QR slip + optional SMS/web link)** at registration. As the patient moves from consultation to billing, laboratory, radiology, doctor follow-up, and pharmacy, staff update workflow states on lightweight web dashboards. The system automatically places the patient into the next appropriate department queue, prevents two departments from calling the same patient at the same time, displays privacy-safe token statuses on hallway screens, and gives both smartphone and non-smartphone patients clear instructions on where to go next.

### 2. Proposed Project Names
*(Note: Trademark, domain, and business registration availability in Nepal have not been verified and must be checked with the Office of the Company Registrar and Mercantile/NP domain registry before adoption.)*
1. **PaloSathi (पालो साथी — "Turn Companion"):** Combines *Palo* (one's turn in line) and *Sathi* (friend/companion). Warm, approachable, and immediately understood by Nepali patients as a helper that guides them through their turn.
2. **SwasthyaBato (स्वास्थ्य बाटो — "Health Path"):** Emphasizes wayfinding and the end-to-end journey across hospital rooms rather than just waiting in a line.
3. **KramSetu (क्रम सेतु — "Sequence Bridge"):** *Kram* (order/sequence) and *Setu* (bridge). Highlights bridging disconnected hospital departments into a coordinated sequence.

### 3. Mission Statement
To uphold patient dignity and reduce avoidable physical exhaustion in Nepali hospitals by turning fragmented, repetitive queues into a single, transparent, and fair patient journey—accessible to every person regardless of literacy, age, disability, or phone ownership.

### 4. Problem Statement (Working Hypothesis for Field Validation)
In many busy Nepali public, community, and teaching hospitals, an outpatient visit requires navigating up to ten separate physical lines across registration, consultation, billing, diagnostics, report collection, review, and pharmacy. Because departments operate in isolation without shared visibility into a patient's journey, patients must physically stand in line just to secure a place, repeatedly explain their case, carry paper slips, and guess when reports are ready. This burden hits older adults, people with disabilities, low-literacy patients, rural travelers, and patients without smartphones hardest.

To design an honest solution, we must distinguish between six distinct causes of hospital delay:

| Delay Category | Root Cause | Can Software Solve It? | Role of This Platform |
| :--- | :--- | :--- | :--- |
| **1. Necessary clinical & processing time** | Doctor examinations, reagent incubation in labs, X-ray positioning. | **No.** Rushing clinical care harms safety. | Set realistic wait expectations so patients can sit comfortably instead of standing in corridors. |
| **2. Capacity shortages** | Too few doctors, lab technicians, or analyzers relative to patient volume. | **No.** Software cannot create staff or machines. | Provide timestamped bottleneck analytics so administrators can allocate counters or shifts better. |
| **3. Avoidable administrative waiting** | Re-typing patient demographics at every counter; queuing in person just to see if a lab report is printed. | **Yes (High Impact).** | Pass demographic and order references via a single Visit ID; notify staff and screens automatically when reports are ready. |
| **4. Poor information transfer** | Doctors' verbal instructions forgotten; billing or lab unsure which room the patient needs next. | **Yes (High Impact).** | Encode ordered steps digitally so the next counter already knows what the patient requires. |
| **5. Uncoordinated queues** | Patient called for X-ray while standing in the blood-collection queue, losing their turn in both. | **Yes (High Impact).** | Enforce a single active-call lock per patient and coordinate parallel test queues. |
| **6. Navigation & communication failures** | Unclear room numbering, missed voice calls in noisy halls, language/literacy barriers. | **Yes (Moderate-High Impact).** | Standardize color/number zone routing, bilingual visual screens, and clear printed slips. |

### 5. Guiding Concept: Long-Term Identity vs. Single Visit ID
**"One visit ID, one coordinated patient journey, and a clear next step."**
* **Long-Term Patient Identity (`patient_id`):** An internal record linking a person across multiple hospital visits over months or years (e.g., name, age/year of birth, phone number if available, optional existing hospital MRN or Health Insurance Board *Bima* number). **A national identity document (Nagarikta or National ID) is never required**, as patients may forget documents, be minors, or come from marginalized groups.
* **Individual Visit ID (`visit_id` & `token_code`):** A temporary, single-episode identifier created when a patient arrives for a specific outpatient episode (e.g., printed as short human-readable code **`M-042`** for today's General Medicine track, backed by a cryptographically random UUID and a short-lived signed QR token). Even if a patient's long-term identity is uncertain or duplicated, the `visit_id` cleanly tracks all queues, orders, payments, and reports for that specific visit.

### 6. Primary Beneficiaries and Institutional Users
* **Primary Beneficiaries:** Outpatients and their family caregivers—specifically prioritizing older adults, patients traveling from rural municipalities, patients with low literacy, people with mobility or sensory impairments, and individuals without smartphones.
* **Institutional Users:** Reception/registration clerks, triage nurses, outpatient doctors, cashiers/insurance clerks, pathology/laboratory staff, radiology technicians, pharmacists, and hospital operations administrators.

### 7. How This Differs from a Basic Digital Token Machine
A standard bank or hospital token dispenser is **counter-centric**: you press a button, get a slip for Counter A, and once served, the system forgets you exist. Our platform is **journey-centric**:
1. **Cross-Department Handoff:** When a doctor orders a blood test and X-ray, the patient's existing Visit ID is automatically staged for billing and diagnostic queues without printing three new unlinked tokens.
2. **Conflict Prevention (Mutex Locking):** If a patient is currently `Called` or `In service` at Phlebotomy, Radiology's queue algorithm skips calling them for 10–15 minutes while preserving their queue rank so they do not lose their spot.
3. **Closed-Loop Doctor Review:** When the lab marks a report `Ready`, the patient is automatically placed into the doctor's "Report Review" sub-queue, eliminating the need to queue for paper pickup just to join another line outside the OPD door.

### 8. Explicit Non-Goals for Version 1 (V1)
* **No Automated Clinical Triage or Diagnosis:** The software never evaluates symptoms or assigns medical urgency automatically; clinical priority is strictly assigned by qualified nurses or doctors.
* **No Full HIS / EMR Replacement:** The platform does not store detailed clinical notes, DICOM medical images, or full pharmacy inventory ledgers, nor does it replace existing accounting software.
* **No Mandatory Patient App or Smartphone Requirement:** Every feature must work for a patient carrying only a printed paper slip.

### 9. Smallest Useful Version (Minimum Viable Pilot)
A **local-network web application** running in **one high-volume Outpatient Department (OPD)**, connected to **one Billing/Insurance counter** and **one Laboratory collection/reporting point**, supporting registration (or MRN lookup), thermal slip printing, doctor order toggling, lab queue calling, report-ready status updates, and automatic re-queueing for same-day doctor review.

### 10. Core Working Assumptions (To Validate in Field Discovery)
* **[Assumption A1 - Team & Budget]:** You are a solo student or 2–4 person engineering team working 15–25 hours/week with a bootstrap budget under NPR 50,000 for prototyping.
* **[Assumption A2 - Hospital IT Access]:** The pilot hospital already has an existing billing/HIS software whose vendor will **not** initially grant you database write access or custom APIs. Your system must work side-by-side via lightweight manual reference entry or simple CSV/barcode bridges.
* **[Assumption A3 - Infrastructure]:** The hospital experiences intermittent internet dropouts and occasional power switchovers (grid to generator/inverter), requiring local network survival and UPS protection.

---

## B. Field Research and Problem Validation

Before writing application code, spend **2 to 3 weeks** inside 1 to 2 candidate hospitals conducting structured observation and interviews.

### 1. Ethical Permission and Privacy Protocol
1. **Institutional Authorization:** Obtain a formal letter from your college department (e.g., Head of Department, Computer Engineering) addressed to the Hospital Director or Medical Superintendent explaining that the study measures **operational queue times and navigation bottlenecks**, not clinical outcomes.
2. **Zero PHI Collection:** Never record patient names, phone numbers, diagnoses, or photos of faces/medical charts during observation. Track observed patients using anonymous observation codes (e.g., `OBS-Day1-04`: *"Male, approx. 65 yrs, accompanied by daughter, walking stick"*).
3. **Verbal Informed Consent:** When shadowing or interviewing a patient, explain in simple Nepali: *"We are engineering students studying hospital waiting lines to make them easier. We will not ask about your illness or write down your name. May we ask you 4 short questions while you wait?"*

### 2. Stakeholder Interview Guide (All 11 Groups)

| Group | Target Sample | Specific Interview Questions to Ask |
| :--- | :--- | :--- |
| **1. Patients** | 10–15 across ages & literacy levels | 1. What time did you leave home today, and how many separate lines have you stood in so far?<br>2. At any point today, were you unsure which room or window to go to next?<br>3. Have you ever missed your turn here because you were in another line (like billing or lab)?<br>4. Do you carry a mobile phone today? If you get an SMS in Nepali or English, can you read it easily, or do you prefer looking at a screen/asking staff? |
| **2. Caregivers / Family** | 8–10 accompanying relatives | 1. Do you and the patient have to split up to hold spots in different lines?<br>2. Where does the patient sit while you run between billing, lab, and pharmacy?<br>3. How do you find out when blood test or X-ray results are ready? |
| **3. Receptionists / Registration** | 3–5 staff | 1. What takes the longest when registering a new patient versus a returning patient vs. a *Bima* (health insurance) patient?<br>2. How do you assign which OPD room or doctor a patient goes to?<br>3. What happens when the computer or printer freezes during morning peak hours (8:00–11:00 AM)? |
| **4. Doctors (OPD)** | 3–5 doctors | 1. How are walk-in patients vs. patients returning with same-day lab reports managed outside your door?<br>2. How much disruption is caused by patients opening the door to ask when their turn is?<br>3. If you had to click 2 buttons on a screen or tablet to order lab/radiology queue routing, what would make that too slow for you? |
| **5. Nurses / Triage / OPD Assistants** | 3–5 staff | 1. How do you currently organize paper tickets outside the doctor's room?<br>2. When a visibly weak, elderly, or urgent patient arrives, how do you move them ahead without causing arguments in the waiting crowd?<br>3. What happens when you call a patient's name three times and they aren't there? |
| **6. Laboratory Staff** | 3–4 phlebotomists & technicians | 1. How do you match a patient in the chair to their paid bill and test request?<br>2. How many patients come to the window every hour just to ask *"Is my report ready yet?"*<br>3. Which tests are ready in 1 hour vs. afternoon vs. next day? |
| **7. Radiology Staff** | 2–3 X-ray / USG staff | 1. How do you handle preparation requirements (e.g., full bladder for pelvic ultrasound, fasting) in the waiting queue?<br>2. What happens when a patient ordered for both blood draw and ultrasound arrives here first vs. lab first? |
| **8. Cashiers / Billing & Bima Clerks** | 3–4 clerks | 1. Why do patients have to queue at billing multiple times in one visit?<br>2. How are government health insurance (*Bima*), poor-fund exemptions, and emergency waivers verified?<br>3. Can you look up a patient quickly by a 4-digit visit number if printed on their slip? |
| **9. Pharmacists** | 2–3 dispensers | 1. Where does the queue bottleneck happen: prescription verification, billing, or medicine picking?<br>2. How often do patients reach the window only to find a medicine is out of stock or unpaid? |
| **10. IT Staff / Computer Operators** | 1–2 staff | 1. What HIS/billing software is currently running, and is it hosted on a local server or cloud?<br>2. How reliable is the LAN/Wi-Fi in OPD, Lab, and Billing during power cuts?<br>3. Which printers, monitors, and UPS units break down most often? |
| **11. Hospital Administrators** | 1–2 leaders (Medical Recorder / Admin Officer) | 1. Which single department queue generates the most patient complaints?<br>2. What operational metrics do you wish you had for board or Ministry reporting?<br>3. Under what conditions would you approve a 2-week supervised pilot in one department? |

### 3. Patient-Journey Observation Template
Print this table on a clipboard and shadow 10–15 consented patients from entry to exit (or observe stationary counters during peak hours, 08:30–12:30):

```text
OBSERVATION LOG | Date: ________ | Day of Week: _____ | Weather: _____ | Observer: _________
Anon Subject ID: OBS-___ | Approx Age Bracket: [<20 | 20-40 | 40-60 | 60+] | Accompanied? [Y/N]
Mobility/Sensory Note: [None / Walking Aid / Wheelchair / Visual-Hearing Aid] | Phone Type: [None / Feature / Smart]
Visit Type: [Cash Walk-in / Appointment / Government Insurance (Bima) / Follow-up]

+------+-------------------+----------+----------+----------+-----------+----------------------------------------+
| Step | Department/Window | Joined   | Called   | Service  | Service   | Observed Friction / Confusion /        |
| #    |                   | Queue At | At       | Started  | Ended     | Rework (Why did delay happen?)         |
+------+-------------------+----------+----------+----------+-----------+----------------------------------------+
| 1    | Registration      | 08:42    | 09:14    | 09:15    | 09:17     | Sent to Bima window first; wrong line  |
| 2    | OPD Room 4        | 09:20    | 10:35    | 10:36    | 10:42     | Crowd clustered at door; no token disp |
| 3    | Cash Counter 2    | 10:45    | 11:08    | 11:08    | 11:10     | Waited 23m just to pay NPR 450         |
| ...  | ...               | ...      | ...      | ...      | ...       | ...                                    |
+------+-------------------+----------+----------+----------+-----------+----------------------------------------+
Total Time in Hospital: ______ mins | Sum of Waiting Times: ______ mins | Sum of Active Service: ______ mins
Number of Physical Queues Joined: ___ | Number of Times Asked Directions: ___ | Missed Call Occurred? [Y/N]
```

### 4. Method for Measuring Queues and Waiting Times
Use two complementary methods:
1. **Longitudinal Shadowing (End-to-End):** Follow individual patients across steps using the template above. This gives the **Ratio of Waiting Time to Active Service Time**:
   $$\text{Wait-to-Service Ratio} = \frac{\sum (\text{Service Start}_i - \text{Queue Join}_i)}{\sum (\text{Service End}_i - \text{Service Start}_i)}$$
2. **Stationary Checkpoint Sampling (Every 15 Minutes):** At a specific bottleneck counter (e.g., Lab Sample Collection), count the number of people physically standing/waiting every 15 minutes ($L$), and stopwatch 20 consecutive service interactions to find the median service duration ($S$).

### 5. Distinguishing Observed Evidence from Assumptions
Maintain a two-column **"Evidence vs. Hypothesis Ledger"**:
* **Observed Evidence:** *"On Tuesday between 9:00 and 10:00 AM, 18 out of 42 patients at the Lab window were only asking if their morning report was ready, interrupting the technician taking blood samples."*
* **Unvalidated Assumption:** *"Patients want an app to download PDF lab reports."* (Must be tested: maybe they just need a hallway screen showing which token numbers have completed reports sent straight to the doctor.)

### 6. Pilot Hospital Suitability Scorecard
Do not pick the largest central hospital first; bureaucracy and massive crowds will overwhelm a student pilot. Score candidate hospitals (Community hospitals, district hospitals, mid-sized teaching hospital departments, or NGO-run hospitals) from 1 to 5 on:
1. **Daily Volume in Target OPD:** Ideal is **80 to 250 patients/day** (high enough to have real queue pain, small enough for 2 students to supervise in person).
2. **Champion Availability:** At least one administrative officer and one senior doctor/nursing in-charge actively want to test improvements.
3. **Physical Proximity:** OPD, Billing, and Lab are within the same building or compound (enabling local Wi-Fi/LAN coverage).
4. **Clear Policy Authority:** Hospital leadership can approve a 2-week trial without waiting 6 months for ministry procurement.

### 7. What Must Be Learned Before Building
Before writing code, you must know: (a) how tokens are currently numbered, (b) whether doctors have desks/devices or rely entirely on an OPD assistant outside the door, (c) how *Bima* (insurance) vs. cash billing splits queues, and (d) the exact rules for same-day report review.

---

## C. Current and Proposed Patient Journeys

### 1. Journey Comparison Table (10-Step Outpatient Flow)

| Step | Current Difficulty | Proposed Improvement | Responsible Staff / Dept | Information Needed | Dependency or Limitation | Expected Benefit to Validate |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **1. Registration / Appointment** | Long morning lines; patients queue in wrong line (Cash vs. *Bima*); demographics re-entered on paper and PC. | Fast intake generates **1 Visit ID (`token_code`)** printed with large number, QR code, and first room destination. Returning patients matched via phone/MRN/previous slip QR. | Receptionist / Registration Clerk | Name, age/sex, phone (optional), payment type (Cash/*Bima*/Exempt), target OPD. | Requires working thermal printer or pre-printed fallback cards. | Faster intake; elimination of wrong-window queuing. |
| **2. Wait for Consultation** | Patients crowd around OPD door fearing someone will cut in; nurses shout names in noisy corridors. | Patient sits in waiting area; hallway TV/audio calls `token_code` (e.g., `M-042`). Nurse dashboard orders queue fairly. | OPD Nurse / Assistant & Doctor | Active queue list for that OPD room, priority flags, appointment slot. | Requires hallway display and nurse clicking "Call Next". | Crowd dispersal from OPD doorway; lower noise and stress. |
| **3. Receive Investigation Instructions** | Doctor scribbles on paper; patient doesn't know whether to go to billing, lab, or ultrasound first. | Doctor (or OPD nurse at door) checks boxes for ordered destinations (`Lab`, `X-Ray`, `USG`) on patient's Visit ID. | Doctor or OPD Assistant | Visit ID, destination checkboxes, preparation notes (e.g., fasting/full bladder). | Must take less than 10 seconds per patient so doctors aren't slowed down. | Clear digital handoff to billing and diagnostic queues. |
| **4. Queue to Pay** | Patient joins billing queue, clerk manually re-types tests from doctor's note; *Bima* patients wait in separate slow queues. | Cashier scans slip QR (or types `M-042`), sees ordered departments, records invoice/receipt ref, or marks *Bima*/Exempt verified. Alternatively, patient pays via Fonepay/QR where supported. | Cashier / Billing Clerk | Visit ID, ordered department flags, HIS receipt number or exemption status. | If no HIS API exists, cashier still keys tests in HIS and enters receipt ref in our tool (takes ~5 sec). | Immediate transition of diagnostic tasks from `Awaiting prerequisite` to `Ready for service`. |
| **5. Find Testing Departments** | Confusing building layout; low-literacy patients struggle with English signs. | Printed slip, kiosk scan, and web page show color-coded zone + floor + landmark (e.g., *"Yellow Zone - Ground Floor, Room 12"*). | Hospital Admin / Wayfinding Setup | Department room numbers, color zones, Nepali/English audio/visual icons. | Requires putting matching colored tape/signs on hospital walls. | Fewer lost patients and fewer interruptions to staff for directions. |
| **6. Queue for Sample Collection & Imaging** | Patient stands in blood draw line while X-ray calls their name and cancels their turn. | **Parallel Coordinator** places patient in both virtual queues but applies an **Active-Call Mutex**: while `In service` at Lab, X-ray skips calling them without dropping their rank. | Lab Phlebotomist & Radiology Tech | Department queue list, preparation status, active lock status across other rooms. | Staff must click `Start Service` and `Complete` reliably. | Zero missed turns due to simultaneous calls across rooms. |
| **7. Wait for Results** | Patient repeatedly walks up to lab window asking if report is ready. | Lab tracks status (`Sample Collected` → `Processing` → `Report Ready`). Hallway board & patient web link show live progress. | Lab / Radiology Technician | Specimen ID, expected turnaround bracket, completion trigger. | Lab must batch-update completed tokens when reports are verified. | Dramatic drop in status-inquiry interruptions at lab windows. |
| **8. Collect Reports** | Separate physical queue just to pick up printed lab sheets to carry 20 meters back to the doctor. | When Lab marks `Report Ready`, system notifies OPD directly (or attaches report reference). If paper is still required by hospital, pickup is batched at a fast-track counter only when ready. | Lab Dispatch / OPD Nurse | `ReportReference` status, critical value alert (if any). | If no digital lab viewer exists in OPD, physical paper still moves via hospital runner or batch window. | Elimination or compression of the report-pickup queue. |
| **9. Return to Doctor for Review** | Returning patients clash with new morning walk-ins at the OPD door; chaotic arguments over whose turn is next. | `Report Ready` automatically moves the Visit ID into the OPD's **"Review Sub-Queue"**. The queue algorithm interleaves e.g. 1 Review patient after every 2 New patients. | OPD Nurse & Doctor | Separate visible columns for `New Consultation` and `Report Review` with automatic interleaving suggestion. | Clear hospital policy on review cutoff times and doctor shift changes. | Predictable, fair integration of report-review patients without doorway fights. |
| **10. Pharmacy & Final Payment** | Long single line where patients wait 25 mins only to learn a medicine requires a substitute or separate payment. | Doctor/OPD marks visit moving to Pharmacy; pharmacy calls by token; dispenses and completes the Visit ID journey. | Pharmacist | Visit ID, prescription paper/reference, billing status. | Often optional in V1 pilot; added in Phase 2 once OPD-Lab loop is stable. | Smooth exit and accurate measurement of end-to-end hospital stay. |

### 2. Handling the 9 Required Real-Life Scenarios

1. **Walk-in Outpatient Consultation:** Patient arrives at 08:30 AM without prior booking, gets token `M-018` at Registration, waits in the seated waiting zone watching the OPD screen, gets called at 09:15 AM, completes consultation with no lab tests needed, and proceeds straight to Pharmacy (`Completed`).
2. **Consultation Followed by Lab Tests and Doctor Review:** Patient `M-019` sees doctor at 09:20 AM. Doctor clicks `Needs Lab + Review`. `M-019` status becomes `Awaiting prerequisite (Billing)`. Cashier clears payment at 09:30 AM → `M-019` auto-enters Phlebotomy queue (`Waiting`). Blood drawn at 09:45 AM → `M-019` enters `Waiting for Result`. At 11:30 AM, Lab marks report ready → `M-019` auto-enters OPD 4's `Review Queue` (`Waiting`). Called at 11:50 AM for doctor review.
3. **Multiple Investigations in Different Departments:** Patient `M-025` needs Fasting Blood Sugar (Lab), Chest X-Ray (Radiology), and Pelvic Ultrasound (USG - requires full bladder). System marks Lab as `Ready for service` first (because patient is fasting and needs to eat after blood draw). USG is marked `Awaiting prerequisite (Bladder prep)` until the ultrasound nurse checks the patient ready. While `M-025` is `Called` at Lab, X-Ray cannot call `M-025`.
4. **A Patient Without a Smartphone:** `M-031` is a 58-year-old farmer with no phone. He receives a thermal paper slip with bold `M-031`, Nepali text, and department color symbol. At every step, hallway TV screens and dual-language audio announcements (`"टोकन नम्बर M-031, कोठा नम्बर ४ मा आउनुहोस्"`) guide him. If confused, any staff member or volunteer desk scans his paper QR code to tell him his exact status.
5. **An Older Adult Assisted by a Caregiver:** A 74-year-old grandmother arrives with her grandson. At registration, the clerk records the grandson's mobile number under `CaregiverAuthorization` for this visit. The grandmother sits in the shaded waiting area while the grandson receives SMS/PWA updates, pays at the cashier, and brings her to the door only when her token enters the "Next 3 to be Called" band.
6. **Results That Become Available on Another Day:** A culture test takes 48 hours. When Lab logs the specimen as `Multi-Day Processing (Expected: Thursday 2:00 PM)`, the current day's Visit journey transitions to `Suspended - Awaiting Future Result`. On Thursday, when Lab marks the report `Ready`, an SMS notifies the patient/caregiver, and when they scan their original slip at reception or the OPD desk on Friday morning, the system reactivates the Visit ID directly into the `Doctor Review` queue without forcing a new full registration queue.
7. **A Missed Token or Late Arrival:** Patient `M-040` is in the washroom when called. The nurse clicks `Mark Temporarily Absent` after waiting 90 seconds. The token is not cancelled; it enters `Temporarily absent` for a configurable grace window (e.g., 45 minutes). When `M-040` returns 12 minutes later and scans his slip at the nurse desk, the system places him back into the queue **2 positions behind the currently served patient** (preventing both queue cutting and unfair punishment of going to the very back of a 60-person line).
8. **An Unavailable Doctor or Closed Department:** Doctor in Room 2 is called to an inpatient emergency for 45 minutes, or Lab closes for sample collection at 2:30 PM. The nurse clicks `Pause Queue (Reason: Doctor in Emergency)` or `Reassign Queue to Room 3`. Hallway screens immediately display a banner (`"कोठा २ को सेवा आकस्मिक कारणले ३० मिनेटका लागि रोकिएको छ"`), and if reassigned, shifts remaining `Waiting` tokens into Room 3 preserving their original arrival timestamps.
9. **An Urgent Patient Redirected Through Staff-Led Clinical Assessment:** A patient waiting with token `M-055` looks pale and dizzy. The triage nurse assesses them clinically and clicks `Elevate Priority → Urgent (Clinical Override)` with mandatory reason note (`"High fever + dizziness per triage nurse"`). `M-055` moves to the top of the `Ready for service` queue immediately after the current patient finishes, and the override is logged in `AuditEvent`.

### 3. Queue Transformation Summary
* **Queues That Disappear Completely:** (1) The queue at the lab window just to ask *"Is my report ready?"*, (2) the physical doorway cluster outside OPD rooms to guard one's turn, and (3) repeated registration queues for same-visit department transfers.
* **Queues That Become Virtual (Sit & Wait instead of Stand in Line):** (1) OPD initial consultation wait, (2) OPD report-review wait, (3) Lab sample collection wait, and (4) Radiology wait.
* **Queues That Remain Physical (Necessary but Faster):** (1) Initial morning registration/intake (shortened via fast QR/MRN lookup), and (2) Cash/Bima payment counter for patients paying cash or requiring physical insurance claim signatures (shortened because orders are pre-linked to the Visit ID).

---

## D. Users, Roles, and Permissions

Technical administrators must never have blanket access to clinical details. We enforce **Role-Based Access Control (RBAC)** scoped by department and visit state.

| Role | View Clinical Orders / Notes | View Queue & Journey Status | Change Queue Status | Override Clinical Priority | Record Billing / Issue Refunds | Upload / Mark Reports Ready | View System Audit Logs |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **1. Patient** | Own visit step names only (no clinical notes) | Own visit only (via signed QR token) | Cancel own visit or request re-entry check-in | No | View own payment status only | View whether own report is `Ready` | No |
| **2. Authorized Caregiver** | Same as Patient (scoped to authorized `visit_id`) | Authorised visit only (expires when visit ends) | Request re-entry check-in for patient | No | View payment status / pay via digital link | View whether report is `Ready` | No |
| **3. Receptionist** | Department name & assigned doctor only | Any active visit (for intake & routing help) | Create Visit, assign initial OPD queue, reprint slip | Flag `Senior Citizen / Disability / Pregnant` accommodation | Record registration fee ref | No | No |
| **4. Doctor** | Full orders & report status for assigned OPD | Own OPD queue & returning review patients | Call, Start, Complete, Route to Lab/Rad/Pharmacy | **Yes** (Clinical Urgent override) | Request fee waiver recommendation | View lab/rad report references | Own actions only |
| **5. Nurse / Triage Staff** | Orders & triage notes for assigned OPD zone | Assigned OPD zone queues | Call, Start, Mark Absent, Re-enter, Reassign room | **Yes** (Triage Clinical Urgent override with mandatory reason) | No | View whether report is `Ready` for review | No |
| **6. Laboratory Staff** | Lab test orders & specimen type only | Lab queues only | Call, Collect Specimen, Mark Processing, Mark Ready | Expedite specimen processing for flagged Urgent cases | View whether Lab order is `Paid/Cleared` | **Yes** (Lab report reference & ready flag) | No |
| **7. Radiology Staff** | Imaging order & prep requirement only | Radiology queues only | Check Prep Ready, Call, Start Imaging, Mark Ready | Expedite imaging for Urgent cases | View whether Radiology order is `Paid/Cleared` | **Yes** (Imaging report ready flag) | No |
| **8. Cashier** | Billable department/order codes & prices only | Billing queue & unpaid orders | Call at billing counter, clear payment prerequisite | No | **Yes** (Mark Paid, Bima Verified, Exempt, or Refunded with receipt ID) | No | Own cashier shift log |
| **9. Pharmacist** | Prescription reference & pharmacy queue status | Pharmacy queue only | Call, Dispense, Mark Partial/Out-of-stock, Complete | Expedite urgent discharge prescriptions | View pharmacy payment status | No | No |
| **10. Hospital Administrator** | **No** (Aggregated anonymized metrics only) | Live queue lengths & wait times across all departments | Configure department hours, counters, & policy rules | Review priority override audit reports | View aggregated billing throughput | No | **Yes** (Read-only operational & override audit logs) |
| **11. System Support Staff (IT)** | **No** (PII and clinical fields masked in logs) | Device connectivity, printer status, queue counts | Restart display sessions, fix printer binding, merge duplicate IDs with Reception approval | No | No | No | **Yes** (System error logs & technical audit trail without clinical payload) |

---

## E. Product Surfaces: Website, Web Application, Mobile App, and Displays

### 1. Evaluation of Product Surfaces and V1 Recommendation
A **Progressive Web App (PWA)** is a standard web application built with HTML, CSS, and JavaScript that can run inside any mobile browser immediately from a QR scan without visiting an app store, while also supporting offline caching and home-screen installation.

**Why a PWA Beats Native Android/iOS Apps in V1:**
In a Nepali hospital corridor, a sick patient on pricey mobile data or basic 3G/4G will not wait to download a 45 MB app from the Google Play Store or remember an Apple ID password just to check their token. Scanning the printed QR slip opens a lightweight (under 100 KB) PWA page in 2 seconds.

| Surface | Belongs in V1 Pilot? | Rationale |
| :--- | :--- | :--- |
| **1. Public Informational Website** | **Yes (Minimal)** | 2 static pages explaining hospital OPD hours, documents to bring (*Bima* card, old slips), and how the token system works. |
| **2. Patient Responsive Web App / PWA** | **Yes (Core)** | Opened via QR code on paper slip or short URL + token entry. Zero install friction. |
| **3. Native Android/iOS Patient App** | **No (Defer to Phase 3)** | High maintenance overhead; adds zero value over a PWA for single-day hospital visits. |
| **4. Staff Web Dashboard** | **Yes (Core)** | Used by Reception, OPD Nurse/Doctor, Cashier, and Lab on existing desktop browsers or cheap tablets. |
| **5. Hospital Admin Dashboard** | **Yes (Lightweight)** | Basic config (rooms, counters, hours) + CSV export of wait-time metrics for pilot evaluation. |
| **6. Public Queue Display (TV/Monitor)** | **Yes (Core)** | Essential for non-smartphone patients; runs in full-screen kiosk browser mode with Web Audio TTS/chimes. |
| **7. Assisted Kiosk / Check-in Station** | **Optional (Assisted Mode in V1)** | Do not buy expensive touchscreen kiosks in V1; place a volunteer/guard with a basic tablet or QR scanner at the OPD entrance. |

### 2. Detailed Surface Specifications

| Surface | Purpose & Users | Pages / Screens | Main Actions & Information Displayed | States (Loading, Empty, Error, Offline) | Accessibility Requirements |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **1. Public Website** | Pre-visit information for patients & families. | `/`, `/departments`, `/how-it-works` | View OPD schedules, required *Bima* documents, lookup live department congestion (Low/Medium/High). | Static HTML cached at edge; offline shows cached timings with "Last updated" banner. | WCAG AA contrast, full Nepali + English toggle, works on 2G connections. |
| **2. Patient PWA** | Personal journey tracker for patients & caregivers with phones. | `/v/[signedToken]`, `/lookup` | Shows 5 core answers (Next step, Where to go, Ready status, Prerequisites, Help desk), live queue band, language switch. | **Loading:** Skeleton card.<br>**Empty:** "Visit completed."<br>**Error:** "Invalid/expired slip—please ask Desk."<br>**Offline:** Shows last synced step + timestamp in yellow banner; auto-reconnects. | Minimum 18px body text, 48x48px touch targets, color-coded destination banners matching wall signs, local audio readout button. |
| **3. Optional Native App (Future)** | Long-term multi-visit history & appointment booking. | Home, Appointments, Family Profiles, Visit Tracker | Book future follow-ups, store multiple family member cards, receive push notifications. | Offline local SQLite cache of past visit summaries. | Screen-reader support (TalkBack/VoiceOver), biometric/PIN optional lock. |
| **4. Staff Web Dashboard** | Queue calling, intake, ordering, & status updates for hospital staff. | `/staff/login`, `/staff/reception`, `/staff/opd/[deptId]`, `/staff/billing`, `/staff/lab`, `/staff/rad` | **Reception:** Register & print slip.<br>**OPD:** Call Next, Start, Mark Absent, Route to Lab/Rad, Complete.<br>**Lab:** Scan slip, Collect, Mark Report Ready. | **Loading:** Spinner on action button (prevents double-click).<br>**Empty:** "No patients waiting in this queue."<br>**Offline/LAN drop:** Red warning bar; disables mutating calls until LAN server responds. | Keyboard shortcuts (`Space` = Call Next, `Enter` = Start Service) so clerks don't need slow mouse clicks; high-contrast status pills. |
| **5. Admin Dashboard** | Operations monitoring & configuration for hospital administrators. | `/admin/overview`, `/admin/departments`, `/admin/reports`, `/admin/audit` | Open/close counters, reassign doctors, view P50/P90 wait times, review priority override logs, export CSV. | Clear alert banners if any display or printer heartbeat is offline for more than 2 minutes. | Clear tabular exports, print-friendly daily summary view. |
| **6. Public Queue Display** | Hallway visual & audio notification for all waiting patients. | `/display/[zoneId]` | Shows **Now Serving** (flashing 5s on call + chime + voice), **Next in Line** (next 5 tokens), **Reports Ready for Review**, and paused-counter alerts. | **Empty:** Hospital welcome & health tips.<br>**Offline:** "Display reconnecting to local server..." while keeping last called numbers visible. | Giant typography (72pt+ for token codes, readable from 10 meters), zero patient names shown, color-blind safe icons. |
| **7. Assisted Kiosk / Scanner Desk** | Help desk scan station for patients without phones or returning from absence. | `/kiosk/scan` | USB barcode/QR scanner reads paper slip → displays giant 5-second status card and checks in `Temporarily absent` patients. | Auto-resets to ready-to-scan screen after 10 seconds for privacy. | Visual + voice readout in Nepali when a paper slip is scanned. |

### 3. Application Sitemap
```text
[Public & Patient Surfaces]
├── /                           (Public Info: OPD Hours, Bima Guide, Today's Congestion)
├── /lookup                     (Manual Entry: Select Today's Date + Token Code e.g. M-042 + 4-digit PIN)
└── /v/:signedVisitToken        (Patient Journey Card — opened directly via QR scan)

[Staff & Display Surfaces (LAN Accessible)]
├── /staff/login                (Role-based login + Counter/Room selection)
├── /staff/reception            (Fast Intake + Thermal Slip Print + Slip Reprint/Merge)
├── /staff/opd/:roomId          (Active Queue, Review Sub-Queue, 1-Click Order Routing)
├── /staff/billing              (QR Scan Lookup, Payment/Bima Verification)
├── /staff/diagnostics/:deptId  (Sample Collection Queue + Batch "Report Ready" Publisher)
├── /kiosk/scan                 (Assisted QR Check-in & Status Readout)
├── /display/:zoneId            (Full-screen TV Board + Audio Announcer)
└── /admin                      (Department Setup, Live Bottlenecks, Audit Trail, CSV Export)
```

### 4. Detailed Wireframe: Patient Journey Screen (`/v/:signedVisitToken`)
This single scrolling screen is designed to answer the five essential patient questions within 3 seconds in both **Nepali (default)** and **English**:

```text
+-------------------------------------------------------------------+
| [नेपाली | English]                        अन्तिम अपडेट: १०:१४ बिहान |
| पाटन सामुदायिक अस्पताल (Pilot Hospital)                             |
+-------------------------------------------------------------------+
| तपाईंको आजको टोकन (Your Token Today):                               |
|                     +-----------------------+                     |
|                     |        M - 042        |                     |
|                     +-----------------------+                     |
|               [ 🔊 यो जानकारी सुन्नुहोस् (Listen in Nepali) ]       |
+-------------------------------------------------------------------+
| १. अब के गर्ने? (WHAT IS MY NEXT STEP?)                            |
|    👉 रगत जाँचको नमुना दिनुहोस् (Give Blood Sample at Laboratory)     |
|                                                                   |
| २. कहाँ जाने? (WHERE SHOULD I GO?)                                 |
|    🟨 पहेँलो क्षेत्र (YELLOW ZONE) — भुइँ तल्ला, कोठा नं. १२         |
|       (Ground Floor, Room 12 — Near Main Staircase)               |
|                                                                   |
| ३. मेरो पालो आयो? (AM I READY TO BE SERVED?)                       |
|    🟢 तयार (READY IN QUEUE) — हाल चलिरहेको: M-038                  |
|    तपाईंभन्दा अगाडि: ३ जना (3 people ahead of you)                 |
|    अनुमानित समय: १० देखि १८ मिनेट (Est. 10–18 mins)                |
|                                                                   |
| ४. पहिले केहि गर्नुपर्छ? (ANYTHING TO DO FIRST?)                    |
|    ✅ बिल भुक्तानी भइसक्यो (Billing Verified - Receipt #8841)      |
|    ⚠️ खाली पेट (Fasting Required: Do not eat until sample taken)   |
+-------------------------------------------------------------------+
| आजको यात्रा (TODAY'S JOURNEY PROGRESS):                            |
|  [✔] १. दर्ता (Registration) ........................ सम्पन्न (08:50)|
|  [✔] २. डाक्टर परामर्श (OPD Room 4) ................. सम्पन्न (09:40)|
|  [✔] ३. बिलिङ / बीमा (Billing) ...................... सम्पन्न (09:55)|
|  [●] ४. प्रयोगशाला (Lab Sample - Room 12) ........... पालो पर्खँदै   |
|  [○] ५. एक्स-रे (X-Ray - Room 15) ................... यसपछि (Next)  |
|  [○] ६. रिपोर्ट देखाउने (Doctor Review - Room 4) ..... बाँकी (Later) |
+-------------------------------------------------------------------+
| ५. कसले मद्दत गर्न सक्छ? (WHO CAN HELP ME?)                        |
|    सोधपुछ कक्ष (Help Desk): मुख्य ढोका नजिक (Near Main Gate)       |
|    वा निलो एप्रोन लगाएको कर्मचारीलाई यो कागजको पर्चा देखाउनुहोस्।     |
+-------------------------------------------------------------------+
```

### 5. Detailed Wireframe: Printed Thermal Paper Slip (80mm Width)
For patients without smartphones, the paper slip itself acts as a physical roadmap:

```text
========================================
        PILOT COMMUNITY HOSPITAL
     मिति (Date): 2083-07-10 (27 Oct)
----------------------------------------
         टोकन नं (TOKEN NO):
              M - 042
       [PRIORITY: SENIOR CITIZEN]
----------------------------------------
 १. पहिलो गन्तव्य (First Step):
    🟦 निलो क्षेत्र - कोठा नं. ४
    (Blue Zone - General OPD Room 4)
    भुइँ तल्ला (Ground Floor)

         +------------------+
         |  [ QR CODE HERE ]|
         |  Scan at any TV  |
         |  or Help Desk    |
         +------------------+
   PIN (वेबमा हेर्न): 4921

 सम्भावित चरणहरू (Check Box by Staff):
 [ ] बिलिङ (Billing - Green Zone)
 [ ] प्रयोगशाला (Lab - Yellow Zone, Rm 12)
 [ ] एक्स-रे (X-Ray - Orange Zone, Rm 15)
 [ ] डाक्टर रिभ्यु (Return to OPD Rm 4)
 [ ] फार्मेसी (Pharmacy - Exit Gate)
----------------------------------------
 कृपया यो पर्चा नहराउनुहोला। (Keep this slip)
========================================
```

---

## F. Core Modules and Priority

We strictly separate **workflow status tracking** (which our system owns) from **complete clinical records** (which stay on the hospital's existing paper OPD ticket or HIS).

### 1. Feature Phasing Matrix (All 13 Modules)

| Module | Priority Tier | Purpose | Inputs | Outputs | Dependencies | Owner | Acceptance Criteria |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **1. Registration & Intake** | **Essential Pilot (V1)** | Create a `Patient` (if new) and issue today's `Visit` + thermal slip. | Name, Age/Sex, Phone (opt), MRN/Bima ID (opt), Target OPD, Accommodation flags. | `patient_id`, `visit_id`, `token_code` (e.g., `M-042`), printed QR slip. | Database, Thermal printer driver. | Receptionist | Registering a walk-in and printing a slip takes less than 20 seconds; works with zero phone number. |
| **2. Walk-in Queue Management** | **Essential Pilot (V1)** | Place walk-in visits into the target OPD queue and manage calling. | `visit_id`, `department_id`, priority level. | Ordered `QueueEntry` list, call events to display. | Registration module. | OPD Nurse / Assistant | Calling next patient updates hallway screen and audio within 2 seconds on LAN. |
| **3. Visit Tracking (Patient Card)** | **Essential Pilot (V1)** | Show live status and 5 core answers via QR scan or kiosk lookup. | `signed_visit_token` or (`token_code` + `pin`). | Bilingual journey card UI with next step & wait band. | Queue & Order states. | Patient / Caregiver / Help Desk | Scanning QR loads page in under 2 seconds on 3G or hospital guest Wi-Fi; no login/OTP required. |
| **4. Department Queues** | **Essential Pilot (V1)** | Manage queue state transitions (`Waiting`, `Called`, `In service`, `Absent`, `Completed`) per counter. | Staff action button clicks (`Call`, `Start`, `Absent`, `Complete`). | State transition event, timestamp logs, mutex lock release. | Auth & RBAC. | All Dept Staff | Two counters in the same department never call the exact same patient simultaneously. |
| **5. Clinician Order Routing** | **Essential Pilot (V1)** | Let doctor/OPD nurse flag which departments the patient needs next. | `visit_id`, destination checkboxes (`Lab`, `X-Ray`, `USG`, `Review`, `Pharmacy`), prep flags. | Created `Order` workflow records linked to `visit_id`. | Active OPD consultation. | Doctor / OPD Nurse | Selecting 2 test departments and clicking "Route Patient" requires at most 3 clicks / 5 seconds. |
| **6. Billing & Prerequisite Status** | **Essential Pilot (V1)** | Track whether ordered investigations are cleared to start (`Paid`, `Bima Verified`, `Exempt`, `Waived`). | `visit_id`, payment status selection, optional HIS receipt number. | Transitions dependent diagnostic `QueueEntry` from `Awaiting prerequisite` to `Ready for service`. | Clinician Order Routing. | Cashier / Bima Clerk | Clearing payment immediately makes the patient visible in the Lab/Radiology `Ready` queue. |
| **7. Lab & Radiology Status** | **Essential Pilot (V1)** | Track sample collection / imaging completion and expected turnaround bracket. | `visit_id`, action (`Sample Collected` / `Imaging Done`), turnaround (`1 hr`, `Afternoon`, `Next Day`). | Specimen/imaging timestamp, updated patient journey card. | Billing status (unless Urgent override). | Lab / Radiology Tech | Marks sample collected and releases active-call lock so patient can be called by the next test department. |
| **8. Report Availability** | **Essential Pilot (V1)** | Notify patients and OPD staff when diagnostic reports are ready without window inquiries. | `visit_id` (single or batch entry of token numbers), `Report Ready` toggle, optional critical flag. | Updates `ReportReference` to `Ready`; shows token on "Reports Ready" TV panel. | Lab & Radiology Status. | Lab / Radiology Tech | Tech can batch-type or scan 10 completed token numbers in under 30 seconds. |
| **9. Doctor Review Re-entry** | **Essential Pilot (V1)** | Automatically queue patients with completed reports back into the doctor's review queue. | All required `Order` items for the visit marked `Report Ready` (or manual nurse check-in). | Moves OPD `QueueEntry` into `Review Sub-Queue` (`Waiting`). | Report Availability. | System Engine / OPD Nurse | Patient appears in OPD's Review list and is interleaved fairly with new walk-ins. |
| **10. Appointments & Slotting** | **Next-Stage (V2)** | Pre-book date/time windows and merge booked patients into the live walk-in queue upon check-in. | Patient details, date, time window, OPD department. | `Appointment` record; transitions to `Waiting` upon arrival check-in. | Registration & Walk-in Queue. | Reception / Patient Web | Checked-in appointment holders are interleaved into the queue within their 30-minute time block. |
| **11. Pharmacy Readiness** | **Next-Stage (V2)** | Queue prescriptions for dispensing and close the outpatient journey. | `visit_id`, prescription routed from OPD. | Pharmacy token call, final visit completion timestamp. | Doctor consultation / review. | Pharmacist | Captures final exit timestamp for total visit duration analytics. |
| **12. SMS & Web Notifications** | **Next-Stage (V2)** | Send opt-in Nepali/English SMS on key milestones (`3 turns away`, `Report Ready`). | `visit_id`, phone number, trigger event. | Queued SMS job via local Nepal gateway (e.g., Sparrow SMS / Aakash SMS). | Background Job Worker, Internet connection. | System Worker | Failed SMS never blocks queue transition; deduplicated so a patient receives at most 3 SMS per visit. |
| **13. Operational Analytics** | **Essential (Basic CSV in V1) → Advanced in V3** | Measure wait times, service times, missed calls, and hourly bottlenecks by department. | Timestamped `AuditEvent` and `QueueEntry` state logs. | P50/P90 wait tables, bottleneck heatmaps, CSV export. | All queue modules. | Hospital Admin | Generates daily baseline vs. pilot comparison metrics without exposing patient PII. |

---

## G. Queue and Journey Coordination Logic

### 1. Formal Queue Entry State Machine
Every department stop in a patient's journey is represented by a `QueueEntry` record that moves through nine explicit states:

```text
[Registered] 
     │ (Order requires Billing or Prep such as Full Bladder)
     ▼
[Awaiting prerequisite] ──(Prerequisite Cleared OR Urgent Clinical Override)──┐
     │                                                                        │
     ▼ (No prerequisite needed)                                               ▼
[Ready for service] ────────────────(Auto-promoted into active pool)───► [Waiting]
                                                                            │  ▲
     ┌──────────────────(Patient returns & checks in within grace window)───┘  │
     │                                                                         │
[Temporarily absent] ◄──(No response after 90s / 2 calls)── [Called] ◄─────────┘
     │                                                         │
     │ (Grace window expires / end of day)                     ▼ (Patient reaches counter/room)
     ▼                                                   [In service]
[Cancelled]                                                    │
                                                               ▼ (Step finished)
                                                          [Completed]
```

* **`Registered`:** Visit created, initial department entry initialized.
* **`Awaiting prerequisite`:** Cannot be called yet because a prior condition is incomplete (e.g., payment/Bima verification pending, fasting window, bladder filling for USG, or waiting for lab reports before Doctor Review).
* **`Ready for service`:** All prerequisites satisfied; eligible to enter the active `Waiting` pool.
* **`Waiting`:** Actively waiting in the department queue to be called.
* **`Called`:** Announced on display/audio and assigned to a specific counter/room. Acquires the **Patient Active-Call Lock**.
* **`In service`:** Patient is physically with the doctor, technician, or clerk. Retains the **Patient Active-Call Lock**.
* **`Temporarily absent`:** Patient did not arrive within the call window (e.g., 90 seconds). Releases the Active-Call Lock so the patient does not block the counter, while holding their eligibility for fast re-entry.
* **`Completed`:** Service at this department finished; releases Active-Call Lock and triggers downstream dependency evaluation.
* **`Cancelled`:** Explicitly cancelled by staff or expired at end of operating day.

### 2. Core Coordination Rules

1. **Clinical Priority & Starvation Prevention (Aging Algorithm):**
   * **Tier 0 (`URGENT_CLINICAL`):** Assigned *only* by a nurse or doctor for medical urgency. Always selected first (FIFO within Tier 0).
   * **Tier 1 (`ACCOMMODATION` / `REVIEW` / `APPOINTMENT`):** Senior citizens (e.g., age 65+), people with disabilities, pregnant women, late-returning `Temporarily absent` re-entries, or returning `Doctor Review` patients.
   * **Tier 2 (`STANDARD_WALKIN`):** Standard walk-in patients.
   * **Anti-Starvation Rule (Effective Score + Max Wait Cap):** If Tier 1 patients keep arriving, Tier 2 walk-ins could wait forever. We prevent indefinite waiting in two ways:
     * **Interleaving Cadence:** At any OPD counter, after serving at most $K = 2$ non-Urgent Tier 1/Review patients consecutively, the system **must** select at least 1 `STANDARD_WALKIN` patient if one has been waiting longer than 15 minutes.
     * **Dynamic Aging Score:** Every minute spent in `Waiting` increases a patient's priority score, ensuring long-waiting standard walk-ins naturally overtake newly arrived Tier 1 entries.

2. **Preventing Simultaneous Calls Across Departments (Active-Call Mutex):**
   * A patient ordered for both `Pathology Lab` and `X-Ray` is `Waiting` in both queues simultaneously so they accrue wait time in both.
   * However, the `Visit` table maintains an atomic field `active_location_dept_id` (plus `lock_expires_at`).
   * When `Pathology Lab` clicks `Call`, the database transaction sets `active_location_dept_id = LAB`.
   * One minute later, when `X-Ray` clicks `Call Next`, the selection query skips any patient whose `active_location_dept_id` is non-null (and not expired). The patient keeps their top rank in X-Ray and is automatically called by X-Ray as soon as `Pathology Lab` clicks `Complete` (plus a 3-minute walking buffer between rooms).

3. **Multiple Tests with Sequencing or Preparation Requirements:**
   * Each `Order` carries an optional `sequence_group` integer (default `1`) and `requires_prep_check` boolean.
   * Example: If a patient has a **Fasting Blood Draw** (`sequence_group = 1`) and an **Upper GI Endoscopy or Post-Prandial Test** (`sequence_group = 2`), group 2 remains in `Awaiting prerequisite` until group 1 is `Completed`.
   * Example: For a **Pelvic Ultrasound** (`requires_prep_check = true`), the patient is listed on the Radiology dashboard under `Prep Holding` until the nursing assistant confirms the patient's bladder is full and clicks `Mark Prep Ready` → transitions to `Waiting`.

4. **Missed Tokens and Fair Re-entry:**
   * When a `Called` patient does not appear within 90 seconds (or 2 audio re-announcements), staff click `Mark Temporarily Absent`.
   * When the patient returns within the grace window (e.g., 45 minutes) and scans their slip at the nurse desk or kiosk, their status returns to `Waiting` with `reentry_boost = true`, slotting them behind the next **2 waiting patients** rather than at the back of the queue or immediately cutting in front of the person standing at the door.

5. **Payment Status vs. Urgent Clinical Care:**
   * **Hard Rule:** When a nurse or doctor flags a visit or order as `URGENT_CLINICAL`, all downstream `QueueEntry` items bypass the `Awaiting prerequisite (Billing)` gate and immediately enter `Waiting` with an `UNPAID_URGENT_WAIVER_PENDING` flag visible to billing for post-hoc reconciliation.
   * Standard payment and exemption categories (`Cash Paid`, `National Health Insurance / Bima`, `Social Service Unit / Poor Fund Exemption`, `Staff/Dependent`, `Doctor Follow-up Waiver`) are configurable per hospital policy.

6. **Staff Overrides and Mandatory Audit Trails:**
   * Any staff user with permission can manually call a specific token out of sequence, elevate priority, or reassign a queue. Every manual override requires selecting a quick reason pill (`Clinical Urgency`, `Elderly/Frail`, `Equipment Delay`, `Admin Correction`) and writes an immutable `AuditEvent` record.

7. **Stale Queue Data and Failed Notifications:**
   * If a staff member leaves a patient in `Called` or `In service` for more than 30 minutes without clicking `Complete`, the dashboard highlights the card in amber and prompts: *"Still in service with M-042? [Keep Active] [Mark Completed]"*. Meanwhile, the cross-department lock (`lock_expires_at`) auto-releases after 20 minutes so the patient is never permanently blocked in other rooms if a clerk forgets to click `Complete`.

### 3. Readable Pseudocode: Next Eligible Patient Selection & Parallel Task Coordination

```python
from datetime import datetime, timedelta

WALKING_BUFFER_SECONDS = 180  # 3 minutes walking time between hospital rooms
LOCK_TIMEOUT_MINUTES = 20     # Auto-release stale lock if clerk forgets to click Complete

def select_next_patient_for_counter(dept_id, counter_id, current_time):
    """
    Runs inside a serializable / row-locked DB transaction (SELECT ... FOR UPDATE SKIP LOCKED).
    Selects the single best eligible patient for `dept_id` while respecting cross-department locks,
    clinical urgency, review interleaving, and starvation prevention.
    """
    dept = db.get_department(dept_id)
    if not dept.is_open(current_time):
        return None, "DEPARTMENT_CLOSED"

    # Fetch all 'Waiting' entries for this department
    candidates = db.query_waiting_entries_for_update(dept_id)
    eligible = []

    for entry in candidates:
        visit = entry.visit

        # 1. Check Cross-Department Active-Call Mutex
        if visit.active_location_dept_id is not None and visit.active_location_dept_id != dept_id:
            if visit.lock_expires_at > current_time:
                continue  # Patient is currently Called or In Service in another room

        # 2. Check Walking Buffer after finishing a previous room
        if visit.last_service_completed_at is not None:
            elapsed = (current_time - visit.last_service_completed_at).total_seconds()
            if elapsed < WALKING_BUFFER_SECONDS and entry.priority_tier != "URGENT_CLINICAL":
                continue  # Give patient 3 minutes to walk from Lab to X-Ray

        eligible.append(entry)

    if not eligible:
        return None, "NO_ELIGIBLE_PATIENTS"

    # 3. Rule A: Clinical Urgent always wins (FIFO by queue entry time)
    urgent_list = [e for e in eligible if e.priority_tier == "URGENT_CLINICAL"]
    if urgent_list:
        urgent_list.sort(key=lambda e: e.ready_at)
        chosen = urgent_list[0]
        return commit_call(chosen, dept_id, counter_id, current_time, reason="URGENT_CLINICAL_FIFO")

    # 4. Rule B: Anti-Starvation Interleaving Guard
    # If the counter served 2 consecutive Tier-1/Review/Re-entry patients, force a standard walk-in
    # if a standard walk-in has waited >= 15 minutes.
    recent_calls = db.get_last_n_non_urgent_calls(dept_id, n=2)
    force_standard = (
        len(recent_calls) == 2 and
        all(c.was_boosted_or_review for c in recent_calls)
    )
    if force_standard:
        long_waiting_walkins = [
            e for e in eligible
            if e.sub_queue == "NEW_WALKIN" and e.priority_tier == "STANDARD"
            and (current_time - e.ready_at).total_seconds() >= 900
        ]
        if long_waiting_walkins:
            long_waiting_walkins.sort(key=lambda e: e.ready_at)
            chosen = long_waiting_walkins[0]
            return commit_call(chosen, dept_id, counter_id, current_time, reason="STARVATION_GUARD_WALKIN")

    # 5. Rule C: Effective Priority Score with Linear Aging
    # Score = Base Boost + (Minutes Waited * 1.0)
    def compute_effective_score(e):
        wait_minutes = max(0.0, (current_time - e.ready_at).total_seconds() / 60.0)
        base_boost = 0.0
        if e.is_reentry_from_absence:
            base_boost += 25.0  # Places returning absent patient near the front
        elif e.sub_queue == "DOCTOR_REVIEW":
            base_boost += 18.0  # Prioritizes closing open visits with ready reports
        elif e.priority_tier == "ACCOMMODATION":  # Senior 65+, Disability, Pregnant, Appointment
            base_boost += 15.0
        return base_boost + (wait_minutes * 1.0)

    eligible.sort(key=lambda e: (-compute_effective_score(e), e.ready_at))
    chosen = eligible[0]
    return commit_call(chosen, dept_id, counter_id, current_time, reason="HIGHEST_EFFECTIVE_SCORE")


def commit_call(entry, dept_id, counter_id, current_time, reason):
    """Atomically transitions entry to Called and locks the Visit."""
    entry.state = "CALLED"
    entry.called_at = current_time
    entry.counter_id = counter_id
    entry.selection_reason = reason

    visit = entry.visit
    visit.active_location_dept_id = dept_id
    visit.lock_expires_at = current_time + timedelta(minutes=LOCK_TIMEOUT_MINUTES)

    db.save(entry, visit)
    event_bus.publish_display_call(dept_id, entry.visit.token_code, counter_id)
    return entry, reason
```

### 4. Worked Example with Fictional Patients
Suppose it is **10:30 AM** in **General Medicine OPD Room 4**. The nurse clicks **`Call Next`**. Five patients are currently in the `Waiting` state for Room 4:

| Token | Fictional Patient | Sub-Queue | Priority Tier | Entered `Waiting` (`ready_at`) | Minutes Waited | Cross-Dept Lock (`active_location`) | Base Boost | Effective Score (`Boost + Wait`) | Eligible Now? |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **`M-012`** | Ram Bahadur (72, Senior) | `DOCTOR_REVIEW` (Lab ready) | `ACCOMMODATION` | 10:15 AM | 15 min | `RADIOLOGY` (Currently in X-Ray!) | +18.0 | 33.0 | **No** (Locked in X-Ray) |
| **`M-019`** | Sita Devi (34, Walk-in) | `NEW_WALKIN` | `STANDARD` | 09:50 AM | 40 min | `None` | 0.0 | **40.0** | **Yes** |
| **`M-028`** | Hari Prasad (68, Senior) | `NEW_WALKIN` | `ACCOMMODATION` | 10:10 AM | 20 min | `None` | +15.0 | **35.0** | **Yes** |
| **`M-031`** | Gita Kumari (29, Returning) | `DOCTOR_REVIEW` (Lab ready) | `STANDARD` | 10:14 AM | 16 min | `None` | +18.0 | **34.0** | **Yes** |
| **`M-045`** | Bishnu Maya (51, Fever/Dizzy) | `NEW_WALKIN` | `URGENT_CLINICAL` | 10:28 AM | 2 min | `None` | Urgent Tier 0 | N/A (Tier 0) | **Yes** |

**Step-by-Step Selection Order Across Four Consecutive Calls:**
1. **Call 1 (10:30 AM):** **`M-045` (Bishnu Maya)** is selected immediately via **Rule A (`URGENT_CLINICAL`)**, even though she only waited 2 minutes, because the triage nurse flagged clinical urgency.
2. **Call 2 (10:36 AM):** **`M-012` (Ram Bahadur)** is still `In service` at Radiology, so he is skipped by the **Active-Call Mutex** (saving him from a missed call in OPD). Among the remaining eligible patients, **`M-019` (Sita Devi, Standard Walk-in)** has an Effective Score of `0 + 46 = 46.0`, beating **`M-028` (Hari Prasad, Senior)** at `15 + 26 = 41.0`. Sita is called! Her 46-minute wait naturally overcame the +15 senior boost—demonstrating **fairness and starvation prevention**.
3. **Call 3 (10:42 AM):** X-Ray clicked `Complete` on **`M-012` (Ram Bahadur)** at 10:38 AM (more than 3 minutes ago, so the walking buffer has cleared). Now `M-012` is eligible with score `18 (Review) + 27 min = 45.0`. **`M-028` (Hari Prasad)** has score `15 + 32 = 47.0`. **`M-028`** is called.
4. **Call 4 (10:48 AM):** **`M-012` (Ram Bahadur)** now has score `18 + 33 = 51.0` and is called for his Doctor Review.

### 5. Wait-Time Estimates as Uncertain Ranges
Never display a single fake countdown like `"14 minutes remaining"`. Hospital consultations vary wildly.
* **Calculation Method:** Compute the rolling median ($P_{50}$) and 75th percentile ($P_{75}$) service duration of the last 15 completed visits in that department today (falling back to the department's historical average if fewer than 5 visits have completed today). Multiply by the number of effective patients ahead divided by active counters ($C$):
  $$\text{Low Estimate} = \max\left(3, \left\lfloor \frac{N_{\text{ahead}} \times P_{25}}{C} \right\rfloor\right), \quad \text{High Estimate} = \left\lceil \frac{N_{\text{ahead}} \times P_{75}}{C} \right\rceil$$
* **When to Suppress Numeric Estimates:** Do **not** show a minute range when:
  1. All counters in the department are currently `Paused` or `Closed` (show *"Queue temporarily paused"*).
  2. Fewer than 3 patients have been served today and no historical baseline exists (show only *"4 patients ahead of you"*).
  3. An `URGENT_CLINICAL` override is currently holding the room for more than 20 minutes (show *"Doctor attending an urgent case; thank you for your patience"*).

---

## H. Technology Stack and Programming Languages

*(Note: All technical capabilities described below rely on stable, standard features of PostgreSQL, Node.js, TypeScript, Next.js, Python/FastAPI, and Flutter. Specific cloud vendor pricing tiers or post-2026 framework patches should be verified against official vendor documentation before procurement.)*

### 1. Comparison of Three Realistic Stacks for a Student Team

| Dimension | Stack 1: Unified TypeScript (Recommended Default) | Stack 2: Python Backend + TypeScript Frontend | Stack 3: Flutter Cross-Platform + Node/Python Backend |
| :--- | :--- | :--- | :--- |
| **Programming Languages** | **TypeScript** (Frontend + Backend) + **SQL** | **Python** (Backend) + **TypeScript** (Frontend) + **SQL** | **Dart** (UI) + **TypeScript/Python** (Backend) + **SQL** |
| **Frameworks** | **Next.js** (React Web/PWA/Displays) + **Fastify** or Next.js Route Handlers (Modular Monolith Backend) | **FastAPI** or **Django** (Backend) + **React / Vite** (Frontend) | **Flutter** (Web/Android) + **Fastify/FastAPI** (Backend) |
| **Database & Cache** | **PostgreSQL** (Primary DB + Row Locking + Job Queue via `pg-boss`) | **PostgreSQL** + **Redis** (Celery/ARQ workers + Pub/Sub) | **PostgreSQL** |
| **Why It Fits / Pros** | **Single language across the entire stack.** Shared TypeScript types (`Visit`, `QueueEntry`) between API and UI eliminate serialization bugs. Fast for a 1–3 student team. | Great if students already know Python from college AI/data courses; Django admin is convenient. | Good if native Android APKs for staff tablets are the top priority. |
| **Cons / Risks for This Project** | Students must structure backend modules cleanly instead of dumping logic into React components. | Context-switching between Python (`snake_case`, Pydantic) and TypeScript (`camelCase`, Zod); two build pipelines. | Flutter Web has heavy initial bundle sizes (2MB+ CanvasKit/Wasm), which is slow on low-end phones scanning a QR code on 3G. |

### 2. Selected Default Stack Breakdown (Unified TypeScript Modular Monolith)

We explicitly separate **programming languages**, **frameworks/libraries**, **databases**, and **infrastructure**:

| Layer | Selected Choice | Category | Role in Platform | Why It Fits & Learning Curve | Operating Cost & Maintenance | Alternatives & Switching Triggers |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Core Language** | **TypeScript (v5.x)** + **SQL** | Programming Language | Type-safe logic across UI, API, queue state engine, and DB queries. | High familiarity among Nepali computer engineering students; catches null/state bugs at compile time. | Zero license cost; single `npm`/`pnpm` workspace. | Switch backend to **Python** only if the team already has strong Django/FastAPI fluency and weak JS skills. |
| **Public Website, Patient PWA, Staff & Display UI** | **Next.js (React)** + **Tailwind CSS** | Web Framework & Styling | Serves lightweight SSR/static patient cards, staff dashboards, and full-screen TV boards. | One codebase serves all web surfaces; built-in routing and bilingual (`next-intl`) support. Moderate learning curve. | Can run on a single local mini-PC or a USD 5–12/mo VPS. | **Vite + React SPA** served by Fastify if Next.js server rendering feels unfamiliar. |
| **Backend API & Queue Engine** | **Node.js (LTS)** with **Fastify** (or modular Next.js API layer) | Backend Runtime & Framework | Runs queue selection algorithm, RBAC checks, SSE broadcasting, and audit logging. | Single-process modular monolith is trivial to debug and deploy on a hospital LAN server. | Low RAM footprint (~150 MB idle). | **NestJS** if the team prefers strict Java/Spring-style dependency injection. |
| **Database** | **PostgreSQL (v16+)** with **Drizzle ORM** or **Prisma** | Relational Database | Stores visits, queues, orders, and audit logs; handles atomic `FOR UPDATE SKIP LOCKED` concurrency. | ACID transactions guarantee two counters never call the same patient. Free and rock-solid. | Runs locally on Linux/Windows or managed cloud; zero cost for local pilot. | None needed; PostgreSQL easily handles 100,000+ visits/month on modest hardware. |
| **Real-Time Updates** | **Server-Sent Events (SSE)** over HTTP (or **Socket.IO**) | Communication Protocol | Pushes live queue changes to TV displays, staff dashboards, and patient PWAs. | SSE works over standard HTTP, auto-reconnects natively in browsers when Wi-Fi flickers, and is simpler than two-way WebSockets. | Zero external service cost (unlike Firebase/Pusher). | Switch to **WebSockets (Socket.IO)** only if bidirectional display remote-control is needed. |
| **Background Jobs & Notifications** | **`pg-boss`** (PostgreSQL-backed job queue) | Background Job Runner | Handles delayed tasks: expiring stale locks, sending SMS via Sparrow/Aakash API with retries. | Uses your existing PostgreSQL database—no need to install and monitor a separate Redis broker in V1! | Zero extra infrastructure process to crash during power cuts. | Add **Redis + BullMQ** only if notification volume exceeds 500 jobs/minute. |
| **Authentication & Authorization** | **Lucia / Custom Session Cookies (Argon2id)** + **HMAC-SHA256 Signed URLs** | Security Library | Staff login via HTTP-only session cookies; patient QR access via signed capability tokens. | Works 100% offline on a hospital LAN (unlike cloud-only Auth0/Clerk/Firebase Auth, which break when the hospital's internet drops). | Zero per-MAU cost; full local control. | Add **Keycloak / OIDC** only if integrating with a large enterprise hospital SSO later. |
| **Hosting & Deployment** | **Docker Compose** on a **Local Hospital Mini-Server (Ubuntu LTS)** + optional Cloud VPS mirror | Infrastructure | Runs the app + PostgreSQL inside the hospital LAN so queues work even when ISP internet fails. | Survives Nepal ISP fiber cuts; single `docker compose up -d` deployment. | Local electricity + hardware only; optional cloud backup costs ~NPR 1,000–2,000/mo. | Cloud-only VPS (e.g., DigitalOcean Bangalore/Singapore) *only* if the hospital refuses on-prem hardware and has dual-ISP failover. |
| **Logging, Monitoring, Backups & Testing** | **Pino** (JSON logs), **pg_dump + restic** (cron backups), **Vitest + Playwright** | DevOps & QA Tooling | Structured logs without PII, automated hourly local + encrypted cloud backups, unit & E2E tests. | Vitest tests the queue algorithm in milliseconds; Playwright simulates multi-counter race conditions. | Free open-source tooling. | Add **Prometheus + Grafana** only when scaling across multiple hospitals. |

---

## I. System Architecture, Data Model, and APIs

### 1. Compact System Architecture Diagram (Local-First Modular Monolith)

```text
+-----------------------------------------------------------------------------------+
|                        HOSPITAL LOCAL AREA NETWORK (LAN / Wi-Fi)                  |
|                                                                                   |
|  +-------------------+   +-------------------+   +-----------------------------+  |
|  | Reception PC      |   | OPD / Lab / Cash  |   | Hallway TV Displays         |  |
|  | Browser +         |   | Staff Browsers    |   | Fullscreen Browser (SSE) +  |  |
|  | Thermal Printer   |   | & USB QR Scanners |   | Bilingual Web Audio Chimes  |  |
|  +---------+---------+   +---------+---------+   +--------------+--------------+  |
|            |                       |                            |                 |
|            +-----------------------+----------------------------+                 |
|                                    | HTTP / SSE (Local LAN IP / mDNS)             |
|                                    ▼                                              |
|  +-----------------------------------------------------------------------------+  |
|  |             ON-PREMISE APPLICATION HOST (Mini-PC + UPS Backup)              |  |
|  |                                                                             |  |
|  |  +-----------------------------------------------------------------------+  |  |
|  |  | Modular Monolith Server (Node.js + TypeScript / Next.js + Fastify)    |  |  |
|  |  |  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐  |  |  |
|  |  |  │ Intake & ID  │ │ Queue & Lock │ │ Order & Prep │ │ RBAC, Audit  │  |  |  |
|  |  |  │ Module       │ │ Coordinator  │ │ Router       │ │ & SSE Hub    │  |  |  |
|  |  |  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘  |  |  |
|  |  +-----------------------------------+-----------------------------------+  |  |
|  |                                      | ACID SQL (SELECT ... FOR UPDATE)     |  |
|  |                                      ▼                                      |  |
|  |  +-----------------------------------------------------------------------+  |  |
|  |  | PostgreSQL 16 Database (Primary Data + pg-boss Job Queue + Audit Log) |  |  |
|  |  +-----------------------------------------------------------------------+  |  |
|  +--------------------------------------+--------------------------------------+  |
+-----------------------------------------|-----------------------------------------+
                                          | (Outbound HTTPS when Internet is Up)
                    +---------------------+---------------------+
                    ▼                                           ▼
     +------------------------------+            +------------------------------+
     | Cloud Reverse Proxy / Mirror |            | Nepal SMS Gateway (Optional) |
     | Serves Patient PWA over 3G/4G|            | & Offsite Encrypted Backups  |
     +------------------------------+            +------------------------------+
```

### 2. Recommended Codebase Structure
```text
palo-sathi/
├── docker-compose.yml
├── package.json
├── prisma/ or drizzle/
│   ├── schema.prisma                # Database schema & migrations
│   └── seed-synthetic.ts            # Synthetic Nepali patient/visit generator for demos
├── src/
│   ├── modules/                     # Domain modules (strict boundaries)
│   │   ├── identity/                # Patient, CaregiverAuthorization, duplicate merge
│   │   ├── visits/                  # Visit lifecycle, signed QR token generation
│   │   ├── queues/                  # Selection algorithm, mutex lock, state machine
│   │   ├── orders/                  # Clinician routing, billing/prep prerequisites
│   │   ├── diagnostics/             # Specimen tracking, ReportReference readiness
│   │   ├── notifications/           # SSE broadcaster + optional SMS job worker
│   │   └── audit/                   # Immutable AuditEvent writer & admin queries
│   ├── web/                         # Next.js App Router pages (Patient, Staff, Display, Admin)
│   ├── i18n/                        # ne.json (Nepali) and en.json (English) translations
│   └── shared/                      # Timezone utils (Asia/Kathmandu), RBAC middleware
└── tests/
    ├── unit/queue-selector.test.ts  # Tests aging, starvation guard, & mutex locks
    └── e2e/pilot-journey.spec.ts    # Multi-counter concurrency tests
```

### 3. Main Data Entities and Relationships (15 Core Entities)

```text
[Hospital (tenant_id)] 1 ─── * [Department] 1 ─── * [ServiceCounter]
         │
         ├── * [StaffUser] * ─── * [StaffRole] (scoped to Department)
         │
         └── * [Patient] 1 ─── * [Visit] 1 ─── * [CaregiverAuthorization]
                                    │
         ┌──────────────────────────┼──────────────────────────┐
         ▼                          ▼                          ▼
   * [Appointment]           * [QueueEntry]               * [Order]
                              (per dept stop)                  │
                                    │             ┌────────────┼────────────┐
                                    ▼             ▼            ▼            ▼
                             * [AuditEvent]  [InvoiceRef] [Specimen]  [ReportRef]
                                                  │       [Status]    [PrescriptionRef]
                                           [PaymentStatus]                  │
                                                                     * [Notification]
```

| Entity | Key Attributes | Authoritative System (System of Record) |
| :--- | :--- | :--- |
| **1. `Patient`** | `id` (UUID), `hospital_id`, `full_name`, `birth_year`, `sex`, `phone_hash`, `phone_masked`, `external_mrn` (nullable), `bima_number` (nullable), `merged_into_id` (nullable). | **Hospital HIS** (if MRN exists); **Our Platform** for temporary walk-in lookup. |
| **2. `CaregiverAuthorization`** | `id`, `visit_id`, `caregiver_name`, `caregiver_phone`, `relationship`, `permissions_scope` (`VIEW_STATUS`, `RECEIVE_SMS`), `expires_at`. | **Our Platform** (strictly scoped to one `visit_id`, auto-expires at visit end). |
| **3. `Visit`** | `id` (UUID), `hospital_id`, `patient_id`, `visit_date_bs` (Bikram Sambat string), `token_code` (e.g., `M-042`), `pin_code` (4 digits), `qr_signature`, `priority_tier`, `active_location_dept_id` (mutex lock), `lock_expires_at`, `last_service_completed_at`, `status`. | **Our Platform.** |
| **4. `Department`** | `id`, `hospital_id`, `code` (`OPD_MED`, `LAB_PATH`, `RAD_XRAY`), `name_ne`, `name_en`, `color_zone`, `floor_room_text_ne`, `operating_hours_json`, `is_paused`. | **Our Platform.** |
| **5. `StaffRole`** | `id`, `staff_user_id`, `role_type` (`RECEPTION`, `DOCTOR`, `NURSE`, `CASHIER`, `LAB`, `RAD`, `PHARMACY`, `ADMIN`, `IT_SUPPORT`), `assigned_dept_id`. | **Our Platform.** |
| **6. `Appointment`** | `id`, `patient_id`, `dept_id`, `scheduled_date`, `slot_window_start`, `slot_window_end`, `visit_id` (linked on arrival), `status`. | **Hospital Scheduling System** or **Our Platform**. |
| **7. `QueueEntry`** | `id`, `visit_id`, `dept_id`, `sub_queue` (`NEW_WALKIN`, `DOCTOR_REVIEW`, `APPOINTMENT`), `state` (9 states), `sequence_group`, `ready_at`, `called_at`, `service_started_at`, `completed_at`, `counter_id`, `is_reentry_from_absence`, `version` (optimistic lock). | **Our Platform.** |
| **8. `Order`** | `id`, `visit_id`, `ordered_by_staff_id`, `target_dept_id`, `category` (`LAB`, `RADIOLOGY`, `REVIEW`, `PHARMACY`), `requires_prep_check`, `prep_note_ne`, `status`. | **Our Platform** (workflow routing level); **Doctor's Paper OPD Ticket / HIS** holds detailed clinical test names. |
| **9. `InvoiceReference`** | `id`, `visit_id`, `order_id`, `external_his_receipt_no`, `recorded_by_cashier_id`, `recorded_at`. | **Hospital Billing / Accounting System** (our system only stores the receipt reference string). |
| **10. `PaymentStatus`** | Enum on `Order`/`InvoiceReference`: `UNPAID`, `CASH_PAID`, `DIGITAL_PAID`, `BIMA_VERIFIED`, `EXEMPT_POOR_FUND`, `URGENT_WAIVER_PENDING`, `REFUNDED`. | **Hospital Billing System** (mirrored in our system as a workflow gate). |
| **11. `SpecimenStatus`** | `id`, `order_id`, `visit_id`, `specimen_Label_ref`, `state` (`PENDING_COLLECTION`, `COLLECTED`, `PROCESSING`, `REJECTED_RECOLLECT`), `expected_ready_bracket`, `collected_at`. | **Lab LIS / Logbook** (workflow state tracked in our platform). |
| **12. `ReportReference`** | `id`, `order_id`, `visit_id`, `is_ready` (boolean), `delivery_mode` (`SENT_TO_OPD`, `PICKUP_WINDOW_3`, `DIGITAL_HIS`), `marked_ready_by`, `marked_ready_at`. | **Lab / Radiology Department** (no raw diagnostic findings stored in V1). |
| **13. `PrescriptionReference`** | `id`, `visit_id`, `external_rx_ref`, `dispense_status` (`WAITING`, `DISPENSED`, `PARTIAL_OUT_OF_STOCK`), `completed_at`. | **Doctor's Paper Ticket / Hospital Pharmacy System**. |
| **14. `Notification`** | `id`, `visit_id`, `channel` (`SSE_DISPLAY`, `SMS`), `template_code`, `delivery_status`, `idempotency_key`, `sent_at`. | **Our Platform.** |
| **15. `AuditEvent`** | `id`, `hospital_id`, `actor_staff_id`, `action_type` (`PRIORITY_OVERRIDE`, `MANUAL_CALL`, `QUEUE_REASSIGN`, `PAYMENT_EXEMPT`, `ID_MERGE`), `visit_id`, `reason_code`, `reason_note`, `created_at`. | **Our Platform** (append-only table). |

### 4. Representative API Endpoints

| Method & Endpoint | Role Allowed | Purpose & Idempotency / Concurrency Mechanism |
| :--- | :--- | :--- |
| `POST /api/v1/visits` | `RECEPTION` | Creates `Patient` (or links existing) + `Visit` + initial OPD `QueueEntry`. Requires header `Idempotency-Key: <UUID>` to prevent double registration if clerk double-clicks. |
| `GET /api/v1/public/visits/:signedToken` | `PUBLIC` (Capability URL) | Returns sanitized patient journey card (5 core questions, next step, queue band). Zero PII exposed if token is invalid. |
| `POST /api/v1/queues/:deptId/call-next` | `NURSE`, `DOCTOR`, `LAB`, `RAD`, `CASHIER` | Executes `select_next_patient_for_counter()` inside a `SELECT ... FOR UPDATE SKIP LOCKED` transaction; acquires Visit mutex lock and emits SSE event. |
| `PATCH /api/v1/queue-entries/:entryId/state` | Assigned Dept Staff | Transitions state (`IN_SERVICE`, `TEMPORARILY_ABSENT`, `COMPLETED`). Requires `expected_version` for optimistic concurrency control. |
| `POST /api/v1/visits/:visitId/orders` | `DOCTOR`, `NURSE` | Creates downstream `Order` and `QueueEntry` records (`Lab`, `X-Ray`, `Doctor Review`) and sets prerequisite gates. |
| `POST /api/v1/visits/:visitId/billing-clear` | `CASHIER` | Records `external_his_receipt_no` and `PaymentStatus` (`CASH_PAID`, `BIMA_VERIFIED`, etc.), transitioning dependent `QueueEntry` rows from `Awaiting prerequisite` to `Waiting`. |
| `POST /api/v1/diagnostics/reports/batch-ready` | `LAB`, `RAD` | Accepts an array of `token_code`s (e.g., `["M-019", "M-031"]`), marks `ReportReference.is_ready = true`, and promotes each visit's `DOCTOR_REVIEW` entry to `Waiting`. |
| `POST /api/v1/visits/:visitId/priority-override` | `NURSE`, `DOCTOR` | Elevates visit to `URGENT_CLINICAL` or manually reorders queue; mandatory `reason_code` creates an `AuditEvent`. |
| `GET /api/v1/streams/displays/:zoneId` | `DISPLAY`, `STAFF` | **Server-Sent Events (SSE)** stream pushing `PATIENT_CALLED`, `QUEUE_UPDATED`, and `REPORT_READY` payloads with monotonic `event_id`s. |

### 5. Sample End-to-End Event Flow
1. **08:45 (`POST /api/v1/visits`):** Reception registers patient → creates `Visit(token_code="M-042")` and `QueueEntry(dept="OPD_MED_4", state="WAITING")`. Thermal slip prints.
2. **09:30 (`POST /api/v1/queues/OPD_MED_4/call-next`):** Nurse clicks Call Next → DB locks `M-042`, sets `Visit.active_location_dept_id = "OPD_MED_4"`, sets `QueueEntry.state = "CALLED"`, broadcasts SSE event to Blue Zone TV (`"M-042 → Room 4"`).
3. **09:38 (`POST /api/v1/visits/:id/orders`):** Doctor checks `[x] Lab` + `[x] X-Ray` + `[x] Return for Review` and clicks Complete Consultation. System marks OPD entry `COMPLETED`, releases mutex lock, creates `Lab` and `X-Ray` entries in `AWAITING_PREREQUISITE (Billing)`, and creates a `DOCTOR_REVIEW` entry in `AWAITING_PREREQUISITE (Reports)`.
4. **09:50 (`POST /api/v1/visits/:id/billing-clear`):** Cashier scans slip QR, enters HIS Receipt `#8841`, clicks `Cleared` → both `Lab` and `X-Ray` entries automatically transition to `WAITING` (`ready_at = 09:50`).
5. **10:05 (`POST /api/v1/queues/LAB_PATH/call-next`):** Lab calls `M-042`. `Visit.active_location_dept_id` becomes `"LAB_PATH"`. At **10:07**, X-Ray clicks Call Next; the selector sees `M-042` is locked at `"LAB_PATH"` and calls `M-043` instead while keeping `M-042` at the top of X-Ray's waiting list.
6. **10:12 (`PATCH /api/v1/queue-entries/:labEntryId/state`):** Phlebotomist finishes blood draw, marks `SpecimenStatus = COLLECTED` and `QueueEntry = COMPLETED`. Mutex lock clears; 3-minute walking buffer starts.
7. **10:16 (`POST /api/v1/queues/RAD_XRAY/call-next`):** Walking buffer has elapsed; X-Ray calls `M-042` and completes imaging at 10:25.
8. **11:40 (`POST /api/v1/diagnostics/reports/batch-ready`):** Both Lab and X-Ray have marked their reports `Ready`. Because all prerequisite orders for `M-042` are now ready, the system automatically transitions `M-042`'s `DOCTOR_REVIEW` queue entry in `OPD_MED_4` from `AWAITING_PREREQUISITE` to `WAITING`.

### 6. Engineering Safeguards: Concurrency, Idempotency, Time Zones, and Integration
* **Duplicate Registration & Identity Correction:** If a patient registers twice on the same morning (or a relative registers them while the patient also queues), Reception can run `POST /api/v1/patients/merge-visits`, which moves active orders and the earliest `ready_at` timestamp onto the surviving `Visit` and cancels the duplicate token cleanly.
* **Concurrency & Preventing Duplicate Calls:** When two lab counters click `Call Next` at the exact same millisecond, PostgreSQL's `SELECT ... FOR UPDATE SKIP LOCKED` ensures Counter 1 locks the first row while Counter 2 skips that locked row and grabs the next eligible patient—zero race conditions.
* **Idempotent Updates & Retry Behaviour:** Every mutating POST request from staff dashboards includes a client-generated `Idempotency-Key` header cached in PostgreSQL for 24 hours. If hospital Wi-Fi drops right as a nurse clicks `Call Next` and the browser retries 3 seconds later with exponential backoff (`500ms`, `1s`, `2s` + jitter), the server returns the exact same call result instead of calling a second patient.
* **Time Zones & Timestamps:** All database timestamps are stored in `TIMESTAMPTZ` (UTC). Notice that **Nepal Standard Time (`Asia/Kathmandu`) is `UTC+05:45`** (a 45-minute offset that breaks naive hour-math!). All daily token sequence resets (e.g., resetting `M-001` at midnight) and UI formatting explicitly use the `Asia/Kathmandu` IANA time zone and display **Bikram Sambat (BS)** dates alongside Gregorian dates via a lightweight conversion library (`nepali-date-converter`).
* **Multi-Hospital Separation:** Every table includes `hospital_id` indexed as the leading column so a single cloud instance or reporting database can later support multiple clinics with strict tenant isolation.
* **Integration with Existing Hospital Systems (Pragmatic First, Standards Ready):**
  * **Level 0 (Pilot Default — Zero HIS Access Required):** Cashier or Reception scans the barcode already printed on the hospital's existing HIS bill, or types the 4-digit receipt reference.
  * **Level 1 (Read-Only CSV / Barcode Bridge):** Encode `external_mrn` + `invoice_no` inside the existing HIS slip barcode so our USB scanner reads it in 1 second.
  * **Level 2 (HL7 v2 / FHIR R4 Adapter — Future):** If a larger hospital's HIS supports standards, map HL7 v2 `ADT^A04` (Outpatient Registration) or FHIR `Encounter` / `ServiceRequest` / `DiagnosticReport` status webhooks into an adapter module without changing our core queue engine.

---

## J. Hardware and Physical Deployment

### 1. Pilot Hardware & Physical Deployment Table (1 OPD + 1 Billing + 1 Lab)
*(Note: All NPR cost ranges below are **unverified planning estimates as of October 2026** based on typical Kathmandu/Dhangadhi retail IT market ranges [New Road / Putalisadak / local suppliers]. Actual prices must be verified with local vendors before purchasing. Reuse existing hospital PCs wherever possible!)*

| Item | Purpose | Placement | Minimum Practical Specification | Status | Pilot Qty | Est. Unit Cost Range (NPR) [Unverified Estimate] | Maintenance & Replacement Concerns |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **1. Local App Server (Mini-PC / Existing Desktop)** | Runs Docker (Node.js + PostgreSQL) on hospital LAN. | Registration or IT room (locked, ventilated). | Intel i3/N100 or Ryzen 3, 8–16 GB RAM, 256 GB NVMe SSD, Gigabit Ethernet, Ubuntu Server LTS. | **Essential** (Reuse existing PC or student laptop in week 1) | 1 | NPR 0 (if reused) or NPR 28,000 – 45,000 | Dust buildup; SSD wear; must be plugged into UPS. |
| **2. Reception PC + Thermal Receipt Printer** | Intake registration and printing 80mm paper Visit tokens. | Registration / OPD Ticket Window. | Existing PC + 80mm Direct Thermal Printer (USB + LAN, auto-cutter, ESC/POS compatible). | **Essential** | 1 | Printer: NPR 8,500 – 14,000<br>Thermal rolls (20 pack): NPR 1,600 – 2,400 | Paper jams, auto-cutter wear, dust on thermal printhead (clean monthly with alcohol swab). |
| **3. 2D QR / Barcode Scanners (USB)** | Instant 1-second lookup of paper Visit slips without typing. | Cashier Window (1), Lab Window (1), OPD Nurse Desk (1). | Wired USB 2D CMOS Imager (reads both paper QR and phone screens; plug-and-play HID keyboard mode). | **Essential** | 3 | NPR 3,500 – 6,000 each (Total: NPR 10,500 – 18,000) | Cable strain from dropping; buy models with rubberized bumpers. |
| **4. Staff Tablets or Existing Desk PCs** | Queue calling and order routing for OPD Nurse/Doctor & Lab. | OPD Nurse Desk (1), Lab Counter (1), Cashier (existing PC). | Any existing desktop browser OR 10-inch Android Tablet (4 GB RAM) in a desk stand. | **Essential** (Reuse existing PCs where present) | 2 tablets (if no PC at OPD/Lab) | NPR 18,000 – 26,000 per tablet | Screen breakage, charger theft, Wi-Fi roaming drops; lock in desk mount. |
| **5. Public Queue Display (TV + Driver)** | Visual queue calling and "Reports Ready" board for waiting patients. | 1 in OPD Waiting Hall, 1 outside Lab Waiting Area. | 32" to 43" Smart/Android TV (or basic LED TV + Android TV Box / Mini-PC) mounted at 2.2m height. | **Essential** (At least 1 in OPD hall) | 1 to 2 | 32"–43" TV: NPR 22,000 – 38,000 (or NPR 0 if hospital has spare TV) | Power surges burn TV boards; plug TV into surge protector / inverter line. |
| **6. External Amplified Speaker** | Audible chime + Nepali/English token call in noisy corridors. | Mounted beside the Public Queue Display. | 10W–20W USB/3.5mm Aux powered stereo speaker (TV built-in speakers are often too muffled in echoing halls). | **Essential** | 1 to 2 | NPR 1,500 – 3,500 | Volume knob tampering; mount high beside TV. |
| **7. Local Networking (Wi-Fi Router + Switch + Cat6)** | Connects Server, Reception, Cashier, OPD, Lab, and TVs on a dedicated subnet. | Central corridor / ceiling mount. | Dual-band Gigabit Router (TP-Link/MikroTik) + 8-port unmanaged switch + Cat6 Ethernet cable for Server & TVs. | **Essential** | 1 router + 50m Cat6 cable | NPR 5,500 – 11,000 | Avoid relying on congested public Wi-Fi; wire the server and TVs with Cat6 cable where possible. |
| **8. Line-Interactive UPS Units** | Keeps Server, Router, and Thermal Printer running during grid-to-generator switchover. | Server/Router (1), Reception Printer (1). | 1000VA–1500VA UPS for Server + Router (~30–45 min runtime); 650VA for Printer. | **Essential** | 2 | NPR 7,500 – 14,000 each | Lead-acid batteries degrade in 18–24 months in warm climates (especially Terai cities like Dhangadhi). |
| **9. Self-Service Kiosk** | Standalone touch kiosk for patients. | Main lobby. | Touch screen stand + printer. | **Optional (Skip in V1)** | 0 in V1 | NPR 85,000+ (Avoid in V1) | Expensive, intimidates low-literacy patients without a human helper. |

### 2. Practical Deployment Realities in Nepal
* **How Printed Tokens & QR Codes Work:** The reception browser prints via a small local print bridge (or WebUSB / standard OS print dialog with silent printing `--kiosk-printing` flag in Chrome/Edge). Each slip has a human-readable token (`M-042`), a 4-digit PIN, and a QR code encoding `https://<local-or-cloud-domain>/v/<signed-token>`.
* **Serving Patients Without Phones:** Everything required to complete the hospital visit is printed on the 80mm paper slip and displayed on the hallway TV screen with bilingual voice announcements (`"टोकन नम्बर M-042, कोठा नम्बर ४"`). Staff mark checkboxes on the paper slip with a pen as a physical backup alongside clicking the dashboard.
* **Privacy-Safe Audio & Screens:** Screens and speakers **never** announce a patient's name, age, disease, or specific test (e.g., never announce *"HIV test"* or *"Pregnancy test"*). They announce only the opaque `token_code` and room/counter number (`"M-042 → Room 12"`).
* **Printer Failures & Consumables Fallback:** Keep **200 pre-printed laminated or cardstock token cards (`F-001` to `F-200`)** in a box at Reception. If the thermal printer jams or runs out of paper during the 9:30 AM rush, the receptionist clicks `Use Pre-Printed Card Mode`, types the card number handed to the patient, and writes the card number on the patient's OPD paper ticket. Zero queue stoppage!
* **Should You Use a Raspberry Pi?** **Recommendation: Avoid Raspberry Pi for the server, and use caution for displays.** In Nepal, a Raspberry Pi 5 + official power supply + micro-HDMI adapter + metal case + high-endurance SD card/NVMe HAT often costs **NPR 16,000–22,000**, and SD cards frequently corrupt during ungraceful power cuts. For displays, a standard **Android TV or a NPR 5,500 Android TV Box** running a locked fullscreen browser app (like Fully Kiosk Browser) is cheaper and easier for hospital electricians to replace; for the server, a used corporate Mini-PC (Dell OptiPlex / Lenovo Tiny with an SSD) or an old laptop with a working battery (built-in UPS!) is far more reliable.
* **No Biometrics by Default:** Biometric fingerprint scanners slow down intake, fail frequently on elderly farmers or manual laborers with worn fingerprints, raise privacy concerns, and add unnecessary hardware cost.

---

## K. Offline Operation, Reliability, and Recovery

### 1. Failure Mode Matrix (5 Distinct Scenarios)
Because the primary application and PostgreSQL database run on the **Hospital Local Area Network (LAN)**, an ISP fiber cut outside the hospital does **not** stop hospital operations.

| Failure Mode | What Continues Working Normally | What Pauses or Degrades | Immediate Staff Action & Fallback Procedure |
| :--- | :--- | :--- | :--- |
| **1. Internet Failure (Hospital LAN still works)** | **95% of system works:** Registration, thermal printing, OPD/Lab/Billing dashboards, hallway TV displays, audio calls, and patient PWA over Hospital Guest Wi-Fi. | Outbound SMS notifications and cloud mirror sync for patients on cellular 3G/4G data pause (`pg-boss` queues them locally). | None required. Banner on Admin screen notes `"ISP Offline — Operating in Local LAN Mode"`. Queued SMS/cloud sync flushes when internet returns. |
| **2. Local Network (LAN / Wi-Fi) Failure** | Reception PC (if directly wired to server) or nothing if the main switch dies. | Staff tablets and hallway TVs lose connection to the local server; red banner `"Network Disconnected"` appears within 5 seconds. | Switch to **Paper Order Fallback**: Nurses call patients using the sequential `M-XXX` numbers already printed on their paper slips and write timestamps on the paper sheet. |
| **3. Power Failure (Grid Drop / Generator Delay)** | Server, Router, and Reception PC/Printer continue on UPS (30–45 min). Staff tablets run on internal batteries. | Hallway TVs turn off until the hospital generator kicks in (typically 30–120 seconds) unless wired to the hospital inverter line. | During TV blackout, nurses step to the door to call the token number shown on their tablet screen. When generator starts, TVs auto-boot into fullscreen `/display/[zoneId]` and catch up via SSE. |
| **4. Backend Server Failure (Hardware / OS Crash)** | Previously printed paper slips remain in patients' hands with sequential `M-XXX` numbers and written checkboxes. | Digital dashboards and TV screens freeze on last known state and display `"System Offline — Use Paper Token Sequence"`. | IT switches to standby laptop and restores latest 15-minute `pg_dump` snapshot (or staff finish the morning shift using paper token numbers in sequential order). |
| **5. Single Device Failure (Printer, Tablet, or TV)** | All other departments and the central queue state continue unaffected. | Only the broken station is affected. | **Printer dead:** Use pre-printed token cards.<br>**Tablet dead:** Log into `/staff/opd/4` from any smartphone browser.<br>**TV dead:** Use nurse voice announcement + patient PWA. |

### 2. Local Hosting vs. Cloud Hosting Trade-offs & Synchronization
* **Why Local-First Wins for Nepal Hospitals:** If your primary database is in AWS Mumbai or Singapore and the hospital's single fiber line drops at 9:45 AM, all 5 counters freeze simultaneously. Hosting the primary database on a local machine inside the hospital guarantees sub-10ms LAN latency and immunity to ISP outages.
* **How Cloud Sync Works Without Complex Conflict Resolution:**
  * Avoid multi-master databases! The **Local Hospital Server is the single authoritative writer** for all queue states.
  * When internet is available, a background worker pushes read-only state snapshots of active visits every 5 seconds to a lightweight cloud edge cache/relay so a caregiver on Ncell/NTC mobile data can view `/v/:signedToken`.
  * If a patient requests a self-check-in over mobile data while internet is down, the cloud page clearly states: *"Please scan your paper slip at the Hospital Help Desk scanner."*
* **Preventing Duplicate Tokens During Offline Intake:** If Reception ever has to operate disconnected from the local server, pre-allocated offline token blocks use a distinct prefix (**`F-001` to `F-200`** for Fallback cards, versus **`M-001`** for server-generated tokens), guaranteeing zero token collisions when merged back.
* **Safe Return from Paper Operation to Digital Operation (Reconciliation Protocol):**
  When recovering from a 30-minute LAN/power outage where nurses called tokens `M-030` through `M-041` manually by voice:
  1. The nurse opens the dashboard and clicks **`Bulk Catch-Up Mode`**.
  2. She selects *"Mark tokens `M-030` through `M-041` as Completed (Served on Paper)"* in one batch action.
  3. The digital queue pointer immediately advances to `M-042` without forcing the nurse to click `Call → Start → Complete` 12 times in a row.

### 3. Pilot Recovery Targets and Testing
* **Recovery Point Objective (RPO — maximum age of lost data):** **At most 15 minutes** (via automated cron job running `pg_dump` every 15 minutes to a secondary USB flash drive plugged into the server + nightly encrypted upload when internet is up).
* **Recovery Time Objective (RTO — maximum time to restore service):** **Under 15 minutes** to switch to a standby student laptop, or **under 2 minutes** to switch staff to the paper token sequence.
* **Pre-Pilot Chaos Drill:** Three days before the live pilot, physically unplug the router power cord and printer USB cable during a simulated 20-patient rehearsal with staff to verify that fallback cards and Bulk Catch-Up Mode work smoothly.

---

## L. Privacy, Security, and Clinical Safety

### 1. Technical Security and Data Minimization Controls
* **Strict Data Minimization:** Never collect citizenship numbers, caste/ethnicity, home addresses, HIV/infectious disease statuses, or clinical diagnoses in the queue platform. Store only what is needed to coordinate the visit: First/given name (for nurse verbal confirmation inside the room), birth year/age bracket (for senior priority), phone number (optional, hashed for lookup and masked as `98******42` on staff screens), and department-level order categories (`LAB`, `X-RAY`).
* **Opaque Capability URLs for QR Codes:** Never put sequential integers (`/visit/42`) or patient names in URLs! Each paper QR code contains a cryptographically random 128-bit token or HMAC-SHA256 signed capability slug (`/v/eyJ2Ijoi...`) that expires automatically 24 hours after the visit completes.
* **Public Screen & Audio Privacy:** Public hallway TVs and audio speakers output **only** `token_code` (`M-042`) and room/counter destination (`Room 4`). Even if a VIP, a neighbour, or a stigmatized patient is in the queue, nobody in the waiting hall can link `M-042` to a person until they step up to the room.
* **SMS & Notification Privacy:** If an SMS is sent, it states: *"PaloSathi [Hospital]: Token M-042 is ready for your next step at Yellow Zone Room 12."* It never mentions medical conditions, test names, or doctor specialties (e.g., never writes *"Psychiatry"* or *"STI Clinic"*).
* **Caregiver Authorization Scope:** A caregiver's phone/link is bound strictly to a single `visit_id` (`CaregiverAuthorization.expires_at = end_of_visit`), never granting permanent access to the patient's future hospital visits.
* **Session Security on Shared Hospital PCs:** Staff sessions use `HttpOnly`, `SameSite=Strict` cookies with a 30-minute idle lock screen requiring a quick 4-digit staff PIN to unlock, and all role switches or priority overrides write to the append-only `AuditEvent` table.
* **Encryption & Synthetic Data:** Use HTTPS/TLS (via local Caddy server with internal root CA on staff devices + Let's Encrypt on public domains) and LUKS full-disk encryption on the local Linux mini-server so a stolen mini-PC yields zero patient data. **All development, classroom presentations, and hospital pitches must exclusively use synthetic data (`seed-synthetic.ts`).**

### 2. Nepal Legal and Regulatory Context (To Verify with Hospital Counsel)
*(Disclaimer: The following points identify relevant Nepali statutes for engineering awareness and are **not legal advice**. Because legal interpretations and ministry guidelines evolve, you and the pilot hospital's administration must verify all obligations before handling real patient data.)*
1. **The Privacy Act, 2075 (2018) (*वैयक्तिक गोपनीयता सम्बन्धी ऐन, २०७५*):** Categorizes health status, medical history, and biometric data as sensitive personal information requiring explicit consent for collection and prohibiting unauthorized disclosure. **How our design aligns:** By collecting zero diagnosis/clinical test results and displaying only anonymous token numbers (`M-042`) in public spaces, we minimize sensitive personal data exposure.
2. **Public Health Service Act, 2075 (2018) (*जनस्वास्थ्य सेवा ऐन, २०७५*):** Mandates confidentiality of patient health records and equal, non-discriminatory access to health services, alongside emergency care obligations regardless of immediate payment capacity. **How our design aligns:** Urgent clinical overrides bypass payment gates immediately.
3. **Electronic Transactions Act, 2063 (2006) (*विद्युतीय कारोबार ऐन, २०६३*) & National Cyber Security Policy:** Governs unauthorized access to computer systems and electronic record integrity. **How our design aligns:** Strict RBAC, Argon2id password hashing, and append-only audit trails protect system integrity.
4. **Institutional Approval Requirement:** Before running a pilot, execute a simple **2-page Memorandum of Understanding (MoU) / Data Processing Agreement** signed by the Hospital Director specifying that (a) the hospital owns all operational data generated on its premises, (b) the student team acts under hospital supervision with confidentiality obligations, and (c) PII is purged or anonymized after operational evaluation.

### 3. Clinical Safety Guardrails
* **Human-in-the-Loop Priority:** The software never asks patients symptom questions to rank their medical severity. Any patient feeling unwell is instructed (on the paper slip, web screen, and wall poster) to alert the Triage Nurse immediately.
* **Instant Override:** A nurse or doctor can override any queue rule in **2 clicks** (`Elevate to Urgent` → `Select Reason`). Software rules must always yield to bedside clinical judgment.

---

## M. Pilot Plan and Development Roadmap

### 1. Recommended Bounded Pilot Scope
**Scope:** **`1 High-Volume Outpatient Department (e.g., General Medicine OPD Room) → 1 Billing/Bima Verification Counter → 1 Pathology Laboratory Sample/Reporting Point → Return to the Same OPD Room for Doctor Review`**.
* **Why this exact boundary:** This loop captures 80% of the coordination pain in a Nepali hospital (the dreaded *OPD → Bill → Lab → Wait for Report → Fight at OPD Door for Review* cycle) while requiring only **4 staff touchpoints** and **1 to 2 hallway screens**. Adding Radiology and Pharmacy in Week 1 would stretch a small student team too thin during live supervision.

### 2. Nine-Phase Development and Pilot Roadmap
*(Assumes a 1–3 student team working ~15–20 hours/week alongside college classes; total duration ~14–16 weeks.)*

| Phase | Duration & Est. Effort | Deliverables | Dependencies | Responsible Roles | Completion Criteria (Definition of Done) | Main Risks & Mitigations |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **1. Field Discovery & Baseline** | Weeks 1–2 (~30 hrs) | Signed permission letter, 25+ stakeholder interviews, 15 shadowed patient journeys, Baseline Metrics Report. | College intro letter, Hospital Director approval. | Student Team + Hospital Liaison | Baseline P50/P90 wait times and queue counts documented for target OPD & Lab. | *Risk:* Staff think students are auditing their performance.<br>*Mitigation:* Frame as studying corridor crowding to reduce interruptions to staff. |
| **2. Workflow Co-Design** | Week 3 (~15 hrs) | Customized state map for target hospital (Cash vs. *Bima* flow), paper wireframe sign-off by Head Nurse & Lab In-charge. | Phase 1 findings. | Student Lead + OPD Nurse + Lab In-charge | Nurse and Lab tech confirm they can operate their screen in under 5 seconds per patient. | *Risk:* Doctors refuse to click software during busy OPD.<br>*Mitigation:* Design so the OPD Nurse/Assistant outside the door can click routing checkboxes from the doctor's paper ticket. |
| **3. Clickable Prototype & Synthetic Demo** | Weeks 4–5 (~35 hrs) | Responsive UI + Synthetic Data Demo (`seed-synthetic.ts`) simulating 50 patients across OPD, Billing, and Lab. | Phase 2 sign-off. | Student Full-Stack Developer | Live walkthrough on laptop/TV accepted by Hospital Admin and Department Heads. | *Risk:* Scope creep requested by admin (e.g., "Build full pharmacy inventory too").<br>*Mitigation:* Log requests into Phase 2 backlog; keep Pilot MoU strictly to OPD-Bill-Lab. |
| **4. Core Engine Implementation** | Weeks 6–9 (~80 hrs) | PostgreSQL schema, `select_next_patient` mutex algorithm, thermal print templates, SSE display board, RBAC, and Bulk Catch-Up mode. | Phase 3 approval. | Student Developers | All unit and multi-counter concurrency tests pass locally in Docker. | *Risk:* Thermal printer driver quirks.<br>*Mitigation:* Buy/borrow the exact 80mm printer model early in Week 6 and test ESC/POS browser printing. |
| **5. Lab & Chaos Testing** | Week 10 (~20 hrs) | Load test (300 visits/day), multilingual UI check, and **Outage Chaos Drill** (unplugging router/printer). | Phase 4 complete + pilot hardware acquired. | Student Team | System recovers cleanly from simulated power/LAN pull within 5 minutes using fallback cards. | *Risk:* Hospital Wi-Fi has dead zones between OPD and Lab.<br>*Mitigation:* Run a 30m Cat6 cable or dedicated repeater during on-site survey. |
| **6. On-Site Setup & Staff Training** | Week 11 (~20 hrs) | Colored zone signs taped on walls, TV mounted, 30-minute hands-on training per counter + laminated 1-page Nepali cheat sheets. | Phase 5 passed. | Student Team + Hospital Staff | Every receptionist, nurse, cashier, and lab tech completes 5 simulated patients without help. | *Risk:* Morning shift vs. afternoon shift staff miss training.<br>*Mitigation:* Train at shift-handover time and stay physically present during Week 1 of pilot. |
| **7. Supervised Live Pilot** | Weeks 12–13 (2 weeks live, ~40 hrs on-site) | Live operation during morning OPD hours (08:30–13:30) for 10 working days with students standing by as floor support. | Phase 6 complete. | Student Floor Support + Hospital Staff | 500+ real patient visits processed through the loop with zero safety incidents. | *Risk:* Peak-hour queue confusion on Day 1.<br>*Mitigation:* Start on a lower-volume day (e.g., Tuesday/Wednesday, not Sunday morning rush!). |
| **8. Evaluation & Impact Report** | Week 14 (~20 hrs) | Baseline vs. Pilot comparison report (P50/P90 wait times, doorway crowding, staff/patient surveys). | Phase 7 logs & observation sheets. | Student Team + Hospital Admin | Joint evaluation review meeting held with Hospital Director. | *Risk:* Hawthorne effect (staff work faster just because students are watching).<br>*Mitigation:* Compare digital timestamps objectively against baseline. |
| **9. Handover or Expansion** | Weeks 15–16 (~20 hrs) | Either transition to ongoing hospital operation (adding 2nd OPD/Radiology) or clean decommission + final thesis/project report. | Phase 8 decision. | Student Team + Hospital IT | Hospital IT can reboot server, replace paper rolls, and run daily backups independently. | *Risk:* Student graduates and system becomes abandonware.<br>*Mitigation:* Document SOPs and set up institutional maintenance model (Section O). |

### 3. Synthetic Data Demonstration Plan (For Hospital Pitch)
Build a special `/admin/demo-simulator` page populated with 40 fictional Nepali personas (e.g., *"Kanchha Tamang, 68, Token M-014"*, *"Sunita Tharu, 27, Token M-015"*). During a 10-minute presentation to the Hospital Director, open 4 browser tabs side-by-side on a projector (Reception, OPD Nurse, Lab, and Hallway TV) and click `Step Simulation` to visually prove how a patient moves from OPD to Billing to Lab and automatically re-enters the Doctor Review queue when Lab marks their report ready.

### 4. Explicit Pilot Rollback Plan ("5-Minute Kill Switch")
If a severe software bug, network failure, or staff bottleneck occurs during the live pilot that threatens patient care:
1. **Trigger Criteria:** Any queue stalls for more than 10 minutes due to software issues, or the OPD Nursing In-charge requests an immediate stop.
2. **Rollback Action (Takes under 3 minutes):**
   * Because every printed slip already carries a sequential human-readable number (`M-001`, `M-002`, ...) and the patient still carries their standard hospital paper OPD ticket, the student coordinator switches the hallway TV to a static banner: *"Please listen for nurse voice announcements by token number."*
   * Nurses call the remaining `M-XXX` numbers verbally in sequential order from the paper tickets—identical to how the hospital operated before the pilot.
   * No patient loses their place in line, no medical record is lost, and zero billing data is corrupted.

---

## N. Testing and Success Measurement

### 1. Comprehensive Verification & Scenario Test Matrix

| Test Category / Scenario | Concrete Test Setup & Input | Expected Pass Criteria |
| :--- | :--- | :--- |
| **1. Duplicate Registration** | Receptionist clicks `Register & Print` twice rapidly on slow Wi-Fi for the same patient; OR registers the same phone/MRN twice within 2 hours. | `Idempotency-Key` returns the single original `Visit` on double-click; second separate submission triggers `"Active visit M-042 already exists today for this patient — [Reprint Slip] or [Create Separate Visit]"`. |
| **2. Simultaneous Patient Calls (Concurrency)** | Run Playwright/Vitest script firing `POST /queues/LAB_PATH/call-next` simultaneously from Counter 1 and Counter 2 within 2 milliseconds, AND firing `POST /queues/RAD_XRAY/call-next` for a patient in both queues. | Lab Counter 1 gets `M-042`, Lab Counter 2 gets `M-043` (zero duplicate call). X-Ray skips `M-042` because `Visit.active_location_dept_id` is locked by Lab. |
| **3. Missed Appointment / Absent Token** | Call `M-040`, wait 90s, click `Mark Temporarily Absent`. Serve 5 more patients (`M-041` to `M-045`). Scan `M-040` at Help Desk 15 minutes later. Scan another absent token `M-010` 3 hours later (after grace window). | `M-040` re-enters `Waiting` with `is_reentry_from_absence = true` and is called within the next 2–3 turns. `M-010` prompts nurse approval to re-activate so expired morning tokens cannot flood afternoon clinics unannounced. |
| **4. Delayed / Multi-Day Results** | Mark `M-050` lab specimen as `Multi-Day (Expected Tomorrow)`. Verify `M-050` does not block today's OPD Review queue. Next morning, mark `M-050` `Report Ready` and scan slip at OPD. | Day 1 visit closes cleanly as `Suspended - Awaiting Result`. On Day 2, scanning the slip places `M-050` directly into `DOCTOR_REVIEW` without requiring a new registration queue. |
| **5. Payment Reconciliation Failure / Urgent Bypass** | Patient `M-060` claims they paid cash, but cashier forgot to click `Cleared` in our tool (or *Bima* server is slow). Separately, Nurse flags `M-061` as `URGENT_CLINICAL` before payment. | Lab tech can click `Verify Physical Receipt #` (entering the paper receipt number directly at the Lab desk to unblock `M-060` in 5 seconds, logged in Audit). `M-061` bypasses the billing gate automatically with `URGENT_WAIVER_PENDING`. |
| **6. Caregiver Access & Expiration** | Register patient with caregiver phone. Open caregiver link `/v/:signedToken` during active visit, then change system clock to 24 hours after visit completion. | During visit, caregiver sees live status (5 core answers) with zero clinical diagnosis details. After 24h post-completion, link returns `"This visit has ended and the temporary tracking link has expired."` |
| **7. RBAC & Permission Boundaries** | Log in as `IT_SUPPORT` and attempt to call `/api/v1/visits/:id/orders`; log in as `LAB` and attempt to call an OPD patient or issue a billing refund. | All unauthorized requests return `HTTP 403 Forbidden` and log a security warning event. |
| **8. Accessibility & Multilingual UI** | Test Patient PWA and Display Board with Nepali (`ne`) and English (`en`), 200% browser zoom, throttled 3G network (500 kbps), and screen reader / TTS audio button. | Zero horizontal scrolling at 200% zoom, contrast ratio at least 4.5:1, page interactive in under 2.5 seconds on 3G, Nepali audio announcement clearly intelligible. |

### 2. Baseline vs. Pilot Success Metrics
Because hospital wait times are heavily right-skewed (a few complex cases or doctor emergencies create long tails), **always report both the Median ($P_{50}$) and the 90th Percentile ($P_{90}$)**—never just the arithmetic mean! All target improvements below are **hypotheses to validate during the 2-week pilot**, not guaranteed outcomes.

| Metric | Operational Definition | How Measured | Target Hypothesis to Validate |
| :--- | :--- | :--- | :--- |
| **1. Total Visit Duration ($P_{50}$ & $P_{90}$)** | Time from Registration intake (`Visit.created_at`) to final OPD Review or exit (`completed_at`). | Baseline shadowing vs. Pilot database timestamps. | **Hypothesis:** Reduce $P_{50}$ total duration for OPD+Lab review visits by **15%–25%**, and reduce $P_{90}$ tail delays by **20%–30%**. |
| **2. Waiting-to-Service Time Ratio** | Total minutes spent in `Waiting` divided by total minutes spent `In service`. | Stationary + longitudinal stopwatch logs vs. DB state transitions. | **Hypothesis:** Reduce unproductive corridor standing/waiting ratio while keeping active doctor consultation time unchanged. |
| **3. Physical Stand-in-Line Queues per Visit** | Number of times a patient must physically stand in a single-file line to hold their place. | Observer tally sheet. | **Hypothesis:** Drop from **5–7 physical standing lines** down to **1–2** (Registration + Cashier, while OPD, Lab, and Review become seated virtual queues). |
| **4. Lab Window Status-Inquiry Interruptions** | Number of times per hour patients walk up to the lab window solely to ask *"Is my report ready?"* | 1-hour tally count by observer at Lab window (09:30–11:30). | **Hypothesis:** Reduce status-inquiry interruptions at the lab window by **at least 50%** once the hallway "Reports Ready" board is live. |
| **5. Cross-Department Missed Calls** | Percentage of called tokens marked `Temporarily absent` because the patient was in another hospital queue. | Nurse tally in baseline vs. system `Temporarily absent` rate. | **Hypothesis:** Reduce cross-department missed calls to **near zero** for linked Lab + Radiology orders via the Active-Call Mutex. |
| **6. Incorrect Routing Incidents** | Patients reaching a counter after waiting, only to be told they are in the wrong room or haven't paid yet. | Counter staff tally sheet. | **Hypothesis:** Reduce wrong-counter arrivals by **at least 60%** via color-coded slips and prerequisite gating. |
| **7. Staff Administrative Friction** | Median seconds spent by Nurse/Lab tech interacting with the dashboard per patient. | Screen interaction telemetry + stopwatch observation. | **Target Threshold:** Must remain **under 8 seconds per patient** so staff workload is reduced (fewer doorway arguments), not increased. |
| **8. Patient & Staff Satisfaction** | 3-question exit survey (1–5 smiley scale in Nepali for patients; 5-question survey for staff). | 50 patient exit interviews + all pilot staff. | **Hypothesis:** At least **80% of patients** report knowing where to go next, and **at least 75% of staff** prefer keeping the system running after the 2-week pilot. |
| **9. System Availability during OPD Hours** | Percentage of scheduled pilot operating minutes (08:30–14:00) where queues operate without falling back to paper. | Server heartbeat logs + incident log. | **Target Threshold:** **At least 99.0% LAN availability** (less than 30 minutes of fallback across 10 pilot days). |

---

## O. Budget and Social Sustainability

### 1. Cost Estimates: Prototype, Pilot, and Ongoing Operations
*(Note: All figures below are **unverified planning estimates in NPR as of October 2026** for student project planning. Excludes student tuition/stipends and existing hospital computers/TVs that can be reused.)*

| Phase / Category | Option A: Low-Cost Bootstrap (Reusing Hospital PC/TV) | Option B: Resilient Dedicated Setup (New Hardware) | Key Assumptions & Exclusions |
| :--- | :--- | :--- | :--- |
| **1. Prototype Phase (Weeks 1–6)** | **NPR 2,500 – 5,000** | **NPR 12,000 – 18,000** | **Option A:** Student laptops + free local Docker + 1 borrowed/used 80mm thermal printer + 5 paper rolls.<br>**Option B:** Buys 1 new thermal printer (NPR 10,000) + 1 USB QR scanner (NPR 4,500) for lab testing. |
| **2. 2-Week Supervised Pilot (1 OPD + Billing + Lab)** | **NPR 18,000 – 32,000** | **NPR 95,000 – 145,000** | **Option A:** Hospital provides existing PCs and 1 hallway TV; budget covers 1 thermal printer, 2 USB QR scanners, 1 router + Cat6 cable, colored wall signage, and 30 thermal rolls.<br>**Option B:** Adds 1 dedicated Mini-PC server (NPR 35k), 1 new 43" TV + speaker (NPR 35k), 2 UPS units (NPR 18k), and 1 staff tablet (NPR 20k). |
| **3. Ongoing Monthly Operating Cost (Per Hospital)** | **NPR 3,500 – 6,500 / month** | **NPR 12,000 – 22,000 / month** | **Option A (LAN + Web only, no SMS):** Thermal paper rolls (~150 rolls/mo @ NPR 90 = NPR 13,500/yr → ~NPR 1,200/mo), cloud backup storage (NPR 1,500/mo), minor hardware reserve (NPR 1,500/mo).<br>**Option B (With SMS + Cloud Relay):** Adds ~3,000 SMS/mo @ ~NPR 1.20–1.50/SMS (~NPR 4,000/mo) + managed VPS (NPR 2,500/mo) + local IT support retainer (NPR 8,000/mo). |

### 2. Financial Sustainability Models (Without Compromising Equity)

| Model | How It Works in Nepal | Pros | Cons / Risks | Recommendation |
| :--- | :--- | :--- | :--- | :--- |
| **1. Tiered Hospital SaaS / Support Subscription (Cross-Subsidization)** | Private clinics and nursing homes pay NPR 15,000–30,000/month for managed hosting, custom branding, and SMS integration; public/community hospitals pay only at-cost maintenance (NPR 5,000–8,000/mo) or are cross-subsidized. | Sustainable recurring revenue; aligns incentives with hospital uptime; zero charge to patients. | Requires a registered social enterprise / IT company to sign maintenance contracts. | **Primary long-term model** once proven in 2+ hospitals. |
| **2. Local Government (Palika) / Provincial Health Sponsorship** | Municipality (*Nagarpalika*) or Provincial Ministry of Social Development funds the initial hardware + annual support contract (~NPR 1.5–2.5 Lakh/year) for their municipal/district hospital. | Fits municipal annual digital health / e-governance budgets in Nepal. | Procurement cycles align with the Nepali fiscal year (Shrawan/Ashadh) and can be slow. | **Best fit for public district & municipal hospitals.** |
| **3. Grants, University Incubation & CSR Partnerships** | Initial pilot funded by college innovation grants, NAST/UGC, commercial bank CSR funds (banks frequently sponsor hospital token systems in Nepal in exchange for a small *"Supported by [Bank Name]"* plaque next to the TV), or health NGOs. | Covers 100% of upfront hardware (TVs, printers, UPS) for cash-strapped public hospitals. | One-off capital grants rarely pay for year-2 thermal paper or software bug fixes unless paired with a maintenance fee. | **Use for Pilot & Phase 1 hardware capex.** |
| **4. Open-Source Core + Paid Implementation/Support** | Release core codebase under an open-source license; charge hospitals only for on-site setup, custom HIS integration, staff training, and SLA support. | Eliminates hospital fear of vendor lock-in; encourages student cohorts to contribute. | Pure volunteer communities rarely provide 9:00 AM emergency support when a printer breaks. | **Combine with Model 1 & 3.** |

### 3. Non-Negotiable Ethical Red Lines
1. **No Paid "VIP / Fast-Track" Queue Jumping:** The platform must **never** charge patients a fee to skip ahead in line or prioritize paying cash patients over *Bima* (health insurance) or poor-fund patients. Queue priority is determined strictly by clinical need, disability/elderly accommodation, and fair wait-time aging.
2. **No Monetization or Sale of Patient Data:** Patient visit logs, phone numbers, and department routing histories must never be sold or shared with pharmaceutical companies, private labs, or advertisers.
3. **No Smartphone Tax:** A patient with no phone and no literacy must receive the exact same queue priority and clear hallway audio/visual guidance as a patient carrying the latest iPhone.

### 4. Software Ownership, Post-Graduation Continuity, and Avoiding Vendor Lock-in
* **Open-Source Licensing:** License the core platform under **GNU AGPLv3** or **Apache 2.0**. The hospital retains perpetual rights to run, inspect, and modify the software on its servers without per-seat license traps.
* **Post-Graduation Handover Plan:** A biggest risk of student hospital projects is abandonment when the student graduates. Prevent this via a **Three-Legged Continuity Plan**:
  1. **Hospital IT Runbook:** Deliver a 10-page Nepali/English Operations Manual covering Docker restart, printer mapping, backup restore, and adding new rooms from `/admin`.
  2. **College Lab / Junior Cohort Continuity:** Anchor the project inside your engineering college's software club or department lab so a sophomore/junior student shadows the deployment before you graduate.
  3. **Registered Student Spin-off or Local IT Partner:** If 2+ hospitals adopt the system, register a lightweight company or partner with a local IT support firm in the city (e.g., Dhangadhi or Kathmandu) on an annual maintenance contract (AMC).
* **Open Data Export:** The `/admin` dashboard includes a one-click **Export All Operational Data (CSV / JSON)** button so the hospital never faces data lock-in.

---

## P. Expansion Beyond Hospitals (Future Adaptability)

*(Note: Keep all non-hospital expansion strictly out of your V1 codebase and pilot scope. Build for hospitals first, but maintain clean module boundaries so the core engine can later serve other Nepali public institutions.)*

In Nepal, citizens face identical multi-window, paper-heavy queue frustrations at **Transport Management Offices (*Yatayat* — driver's license biometrics, medical check, fee counter, card pickup)**, **Land Revenue Offices (*Malpot*)**, **Municipality Ward Offices (*Wada Karyalaya*)**, and **Commercial Banks (remittance, KYC, teller, loan desk)**.

| Architectural Layer | Reusable Across Banks, Ward Offices & *Yatayat* (Core Journey Engine) | Hospital-Specific Only (Clinical Workflow Layer — Keep Separate) |
| :--- | :--- | :--- |
| **Identity & Visit Token** | `Visit`, `token_code` (`A-042`), QR capability URL, PIN lookup, SMS/SSE notifications, thermal slip printing, and pre-printed fallback cards. | MRN / *Bima* insurance number linking, `CaregiverAuthorization`, clinical accommodation flags. |
| **Queue & Routing Engine** | Multi-step journey state machine (`Awaiting prerequisite`, `Waiting`, `Called`, `In service`, `Temporarily absent`, `Completed`), Active-Call Mutex across rooms, anti-starvation aging score, and uncertain wait-range estimator. | **Triage Clinical Urgent Override**, **Doctor Report-Review Sub-Queue Interleaving**, and fasting/bladder preparation gates. |
| **Hardware & Offline Sync** | Local-first Docker server, fullscreen Android TV + bilingual Nepali/English voice announcer, USB 2D scanner workflows, and Bulk Catch-Up mode after power cuts. | Privacy suppression rules designed specifically for medical stigma (though privacy is helpful in banks/government offices too). |
| **Domain Modules** | Generic `ServiceOrder` (e.g., *Document Verification → Fee Counter → Officer Sign-off*) and `DocumentReadiness` status. | `SpecimenStatus`, `ReportReference`, `PrescriptionReference`, HL7/FHIR adapters, and urgent payment waiver rules. |

---

## Q. Final Implementation Brief

### 1. Recommended First Product
**PaloSathi (पालो साथी) V1:** A **local-first, bilingual (Nepali/English) web application and thermal-slip coordination platform** running inside a hospital's Local Area Network (LAN). It issues **one printed QR Visit Slip** at registration and coordinates the patient's journey across OPD, Billing, and Laboratory queues using lightweight staff web dashboards, privacy-safe hallway TV displays with voice announcements, and a zero-install Patient PWA.

### 2. Exact Pilot Scope
* **Setting:** One suitable community, district, or teaching hospital outpatient track (80–250 patients/day).
* **Loop Covered:** **1 General OPD Room → 1 Billing/Bima Verification Counter → 1 Pathology Lab Collection & Reporting Counter → Return to the Same OPD Room for Doctor Review**.
* **Duration:** 2 weeks (10 working days) of supervised morning operation following 2 weeks of baseline field observation.
* **Explicitly Excluded from V1 Pilot:** Native Android/iOS apps, self-service touchscreen kiosks, automated symptom triage, full EMR/clinical note storage, and pharmacy inventory management.

### 3. Selected Programming Languages and Technology Stack
* **Programming Languages:** **TypeScript** (Frontend, Backend, Queue Engine) + **SQL** (Database queries).
* **Frameworks & Libraries:** **Next.js (React + Tailwind CSS)** for Patient PWA, Staff Dashboards, and Hallway TV Display; **Node.js + Fastify** (or modular Next.js Route Handlers) for backend APIs; **Server-Sent Events (SSE)** for real-time display/dashboard updates; **`pg-boss`** for background jobs.
* **Database:** **PostgreSQL 16** (using `SELECT ... FOR UPDATE SKIP LOCKED` for atomic queue selection and row-level concurrency).
* **Deployment Infrastructure:** **Docker Compose** running on a local Ubuntu LTS Mini-PC (or repurposed desktop/laptop with UPS) on the hospital LAN.

### 4. Minimum Hardware for Pilot
1. **1 Local Server:** Reused hospital desktop, student laptop, or Mini-PC (8GB RAM, SSD) on a UPS.
2. **1 80mm Thermal Receipt Printer** at Registration + 200 laminated/cardstock pre-printed fallback token cards (`F-001` to `F-200`).
3. **3 Wired USB 2D QR Scanners** (Cashier, Lab, OPD Nurse Desk).
4. **1 or 2 Hallway Displays:** 32"–43" TV + external 15W speaker in the OPD/Lab waiting area (plus existing PCs or 2 budget Android tablets for OPD Nurse and Lab).
5. **1 Dedicated Dual-Band Router + Cat6 Ethernet Cable** linking the Server and TV display reliably.

### 5. Main Assumptions to Validate in Week 1
1. That an OPD Nurse/Assistant (or Doctor) can check 1–3 routing boxes (`Lab`, `Review`) in under 5 seconds without slowing down consultations.
2. That Cashiers and Lab staff can scan the paper slip QR code in 1 second alongside their existing billing/HIS software.
3. That hallway TV displays + Nepali audio announcements effectively guide non-smartphone and low-literacy patients without creating confusion at the doorway.
4. That the hospital's electrical sockets for the server, router, and TV can be backed by UPS or the hospital's inverter line.

### 6. Five Largest Risks and Concrete Mitigations

| Risk | Concrete Mitigation |
| :--- | :--- |
| **1. Staff Resistance / Extra Clicking Burden during Peak Morning Rush** | Co-design screens with the OPD Nurse and Lab Tech first; support 1-second USB QR scanning and single-key shortcuts (`Space` to call next); never require staff to type patient names outside Registration. |
| **2. Power Cuts, Generator Switchover Lags, or LAN Drops** | Host PostgreSQL and the app on the local LAN on a UPS; keep 200 pre-printed fallback cards at Reception; build a 1-click **Bulk Catch-Up Mode** to sync paper-served tokens when power returns. |
| **3. Patients Returning with Lab Reports Clashing with New Walk-ins** | Implement the dedicated **`DOCTOR_REVIEW` Sub-Queue** with automatic interleaving (+18 priority boost + anti-starvation guard) and display both queues transparently on the OPD hallway TV. |
| **4. Simultaneous Calls Across Lab and Radiology Causing Missed Turns** | Enforce the database-level **Active-Call Mutex (`active_location_dept_id`)** plus a 3-minute walking buffer between rooms so a patient `In service` at Lab is never called by X-Ray at the same time. |
| **5. Project Abandonment After Student Graduation** | Use standard open-source TypeScript/PostgreSQL in Docker, write a 10-page Nepali/English IT runbook, provide 1-click CSV data export, and establish a college lab or local IT partner handover before pilot expansion. |

### 7. First-Week Action Checklist (Start Tomorrow)
- [ ] **Day 1:** Draft a 1-page project brief and obtain an official introductory letter from your Computer Engineering Department Head for field observation.
- [ ] **Day 2:** Visit 2 candidate hospitals near you (e.g., a municipal, zonal/provincial, or community hospital); meet the Hospital Administrator / Medical Recorder and Nursing In-charge to request permission for a 5-day non-intrusive queue observation study.
- [ ] **Day 3:** Print 20 copies of the **Patient-Journey Observation Template** (Section B.3) and conduct a 3-hour morning observation (08:30–11:30 AM) across Registration, 1 OPD room, Billing, and Lab.
- [ ] **Day 4:** Interview at least 5 waiting patients/caregivers, 1 receptionist, 1 OPD nurse, 1 cashier, and 1 lab technician using the questions in Section B.2.
- [ ] **Day 5:** Map the candidate hospital's exact current flow (especially how *Bima* vs. Cash billing and same-day lab report reviews work) and score the hospital using the Suitability Scorecard (Section B.6).
- [ ] **Day 6–7:** Initialize the Git repository, set up the PostgreSQL + Next.js/TypeScript schema for `Visit` and `QueueEntry`, and build the clickable **Synthetic Data Demo** (`seed-synthetic.ts`) to show hospital staff in Week 2.

### 8. Essential Unanswered Questions (For You and the Pilot Hospital)
**Questions for You (The Student Team):**
1. Are you building this solo or with 2–3 classmates, and is this tied to a fixed academic deadline (e.g., Final Year Project defense)?
2. Which specific city or district in Nepal (e.g., Dhangadhi, Kathmandu Valley, Pokhara, Bharatpur, etc.) will you run the pilot in, and do you already have a personal contact at a local hospital?
3. What existing hardware (laptops, old desktop PC, router, or thermal printer) can your team or college lab lend for the 2-week pilot before spending money?

**Questions to Ask the Candidate Pilot Hospital in Your First Meeting:**
1. Which single OPD department has the highest rate of patients going to the laboratory and returning the same day for report review?
2. How does the hospital currently separate **Government Health Insurance (*Bima*)** patients from cash patients at Registration and Billing?
3. Does the doctor sit with a computer/tablet on their desk, or is there an OPD nursing assistant stationed outside the door who manages the paper tickets and calls patients in?
4. Are same-day lab reports still carried back to the doctor on physical paper by the patient, or does the doctor view them on a computer screen?
5. Are the wall sockets at Registration, OPD, and Lab connected to the hospital's backup generator/inverter line during power cuts?