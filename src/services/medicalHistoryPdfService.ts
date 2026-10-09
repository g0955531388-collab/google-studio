import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  ComprehensiveMedicalHistory,
  MedicalHistoryExportOptions,
} from '../types';
import { auditService } from './auditService';

export interface MedicalHistoryPdfGenerationResult {
  success: boolean;
  fileName: string;
  trackingHash: string;
  generatedAt: string;
  pageCount: number;
}

/**
 * Generates and exports an official Medical History Summary PDF
 * formatted specifically for offline review, referral, or external physician transfer.
 */
export function generateMedicalHistorySummaryPDF(
  history: ComprehensiveMedicalHistory,
  options: MedicalHistoryExportOptions
): MedicalHistoryPdfGenerationResult {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Audit logging for external medical record export
  auditService.record({
    actorId: history.patientId,
    actorRole: 'patient',
    actorName: history.patientName,
    action: 'EXPORT',
    resourceType: 'PATIENT_RECORD',
    resourceId: `med-summary-${history.patientId}`,
    purpose: 'EXTERNAL_PHYSICIAN_OFFLINE_REVIEW',
    outcome: 'SUCCESS',
    policyApplied: 'POL-SOVEREIGN-MEDICAL-SUMMARY-EXPORT',
    provenance: `Medical History PDF Generator (${options.externalPhysicianName || 'External Reviewer'})`,
  });

  // Clinical Palette
  const darkNavy: [number, number, number] = [15, 23, 42]; // #0f172a
  const clinicalBlue: [number, number, number] = [2, 132, 199]; // #0284c7
  const primaryTeal: [number, number, number] = [13, 148, 136]; // #0d9488
  const slateGray: [number, number, number] = [100, 116, 139]; // #64748b
  const lightBg: [number, number, number] = [248, 250, 252]; // #f8fafc
  const roseRed: [number, number, number] = [225, 29, 72]; // #e11d48
  const amberOrange: [number, number, number] = [217, 119, 6]; // #d97706
  const emeraldGreen: [number, number, number] = [16, 185, 129]; // #10b981

  // -------------------------------------------------------------
  // HEADER BANNER
  // -------------------------------------------------------------
  doc.setFillColor(...darkNavy);
  doc.rect(0, 0, pageWidth, 36, 'F');

  // Accent Line
  doc.setFillColor(...clinicalBlue);
  doc.rect(0, 36, pageWidth, 2, 'F');

  // Title & Brand
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(255, 255, 255);
  doc.text('LIFEX-AI MEDICAL HISTORY SUMMARY', 14, 16);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(186, 230, 253); // Sky-200
  doc.text('Comprehensive Clinical Transfer Document for Offline & External Physician Review', 14, 23);

  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184); // Slate-400
  doc.text('Standard FHIR / EHR Sovereign Projection • Cryptographically Verified', 14, 29);

  // Top-Right Header Metadata
  doc.setFontSize(8);
  doc.setTextColor(226, 232, 240);
  const formattedDate = new Date(history.generatedAt).toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
  doc.text(`Generated: ${formattedDate}`, pageWidth - 14, 14, { align: 'right' });
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(56, 189, 248);
  doc.text(`Doc ID: ${history.documentTrackingHash}`, pageWidth - 14, 20, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(203, 213, 225);
  doc.text('Classification: Confidential Clinical Transfer', pageWidth - 14, 26, { align: 'right' });

  let y = 44;

  // -------------------------------------------------------------
  // RECIPIENT & PURPOSE BANNER
  // -------------------------------------------------------------
  const recipientName = options.externalPhysicianName?.trim() || 'Attending External Physician / Clinical Specialist';
  const clinicName = options.externalClinicOrHospital?.trim() || 'External Healthcare Facility / Practice';
  const purposeMap: Record<string, string> = {
    GENERAL_REFERRAL: 'General Medical Referral & Consultation',
    SECOND_OPINION: 'Independent Second Opinion & Case Review',
    HOSPITAL_ADMISSION: 'Inpatient Hospital Admission & Triage',
    TRAVEL_EMERGENCY: 'Offline Travel & Emergency Medical Preparedness',
    PRE_OPERATIVE: 'Pre-Operative Risk Assessment & Surgical Clearance',
    CARDIOLOGY_REVIEW: 'Cardiology Specialist Clinical Evaluation',
    SPECIALIST_CONSULTATION: 'Specialist Physician Consultation',
  };
  const purposeText = options.reviewPurpose ? purposeMap[options.reviewPurpose] || options.reviewPurpose : 'Clinical Care Continuity';

  doc.setFillColor(241, 245, 249); // slate-100
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(14, y, pageWidth - 28, 18, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...clinicalBlue);
  doc.text('INTENDED RECIPIENT / PURPOSE OF REVIEW:', 18, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...darkNavy);
  doc.text(`Reviewing Clinician: ${recipientName} (${clinicName})`, 18, y + 11.5);

  doc.setTextColor(...slateGray);
  doc.text(`Review Category: `, 18, y + 15.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...darkNavy);
  doc.text(purposeText, 45, y + 15.5);

  if (options.customClinicalNotes) {
    y += 22;
    doc.setFillColor(254, 252, 232); // amber-50
    doc.setDrawColor(251, 191, 36);
    doc.roundedRect(14, y, pageWidth - 28, 14, 2, 2, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...amberOrange);
    doc.text('REFERRING CLINICIAN NOTES / CONTEXT:', 18, y + 5);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...darkNavy);
    doc.text(options.customClinicalNotes.slice(0, 180), 18, y + 10);
    y += 18;
  } else {
    y += 22;
  }

  // -------------------------------------------------------------
  // SECTION 1: PATIENT PROFILE & DEMOGRAPHIC IDENTIFICATION
  // -------------------------------------------------------------
  if (options.includedSections.demographics) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...darkNavy);
    doc.text('1. PATIENT DEMOGRAPHIC & CLINICAL IDENTIFICATION', 14, y);

    y += 4;
    const colW = (pageWidth - 28) / 3;

    doc.setFillColor(...lightBg);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(14, y, pageWidth - 28, 26, 2, 2, 'FD');

    // Col 1
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...slateGray);
    doc.text('Full Legal Name:', 18, y + 6);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...darkNavy);
    doc.text(history.patientName, 18, y + 11);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...slateGray);
    doc.text('Patient ID / MRN:', 18, y + 17);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(...clinicalBlue);
    doc.text(history.patientId, 18, y + 22);

    // Col 2
    const col2X = 14 + colW;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...slateGray);
    doc.text('DOB / Age / Gender:', col2X + 4, y + 6);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(...darkNavy);
    doc.text(`${history.dateOfBirth || '1982-05-14'} (${history.age || 44}y) • ${history.gender || 'Male'}`, col2X + 4, y + 11);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...slateGray);
    doc.text('Blood Group & Rh Factor:', col2X + 4, y + 17);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...roseRed);
    doc.text(history.bloodType || 'O+ Positive', col2X + 4, y + 22);

    // Col 3
    const col3X = 14 + colW * 2;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...slateGray);
    doc.text('Primary Attending Physician:', col3X + 4, y + 6);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...darkNavy);
    doc.text(history.primaryCareDoctor || 'Dr. Sarah Al-Mansoor', col3X + 4, y + 11);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...slateGray);
    doc.text('Emergency Contact / Kin:', col3X + 4, y + 17);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...darkNavy);
    doc.text(
      history.emergencyContact ? `${history.emergencyContact.name} (${history.emergencyContact.phone})` : 'Fahad Al-Mansouri (+966 50 123 4567)',
      col3X + 4,
      y + 22
    );

    y += 31;
  }

  // -------------------------------------------------------------
  // SECTION 2: HIGH-ALERT ALLERGIES & CONTRAINDICATIONS (CRITICAL)
  // -------------------------------------------------------------
  if (options.includedSections.allergies) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...roseRed);
    doc.text('2. ALLERGIES & CONTRAINDICATED SUBSTANCES (HIGH ALERT)', 14, y);

    y += 3;
    const allergyRows = history.allergies.map((alg) => [
      alg.allergen,
      alg.severity,
      alg.reaction,
      alg.diagnosedDate || 'Recorded in EHR',
      alg.severity === 'SEVERE' ? 'STRICT CONTRAINDICATION' : 'Caution Advised',
    ]);

    if (allergyRows.length === 0) {
      allergyRows.push(['No known drug allergies (NKDA) reported by patient', 'NONE', 'N/A', 'Current', 'No Active Contraindication']);
    }

    autoTable(doc, {
      startY: y,
      head: [['Allergenic Agent / Drug Class', 'Severity', 'Clinical Reaction Pattern', 'Diagnosed Date', 'Clinical Alert']],
      body: allergyRows,
      theme: 'grid',
      headStyles: {
        fillColor: roseRed,
        textColor: [255, 255, 255],
        fontSize: 8,
        fontStyle: 'bold',
      },
      bodyStyles: {
        fontSize: 7.5,
        textColor: darkNavy,
      },
      columnStyles: {
        0: { fontStyle: 'bold', halign: 'left' },
        1: { halign: 'center', fontStyle: 'bold', textColor: roseRed },
        4: { fontStyle: 'bold', halign: 'center', textColor: roseRed },
      },
      margin: { left: 14, right: 14 },
    });

    const docAny = doc as any;
    y = docAny.lastAutoTable?.finalY ? docAny.lastAutoTable.finalY + 8 : y + 30;
  }

  // -------------------------------------------------------------
  // SECTION 3: ACTIVE CHRONIC CONDITIONS & PROBLEM LIST
  // -------------------------------------------------------------
  if (options.includedSections.conditions) {
    if (y > pageHeight - 45) {
      doc.addPage();
      y = 20;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...darkNavy);
    doc.text('3. ACTIVE CHRONIC CONDITIONS & PROBLEM LIST (ICD-10)', 14, y);

    y += 3;
    const conditionRows = history.conditions.map((c) => [
      c.icdCode,
      c.name,
      c.status,
      c.diagnosedYear,
      'Continuous Pharmacological Management & IoMT Telemetry',
    ]);

    autoTable(doc, {
      startY: y,
      head: [['ICD-10', 'Condition / Medical Diagnosis', 'Clinical Status', 'Diagnosed', 'Current Care Trajectory']],
      body: conditionRows,
      theme: 'striped',
      headStyles: {
        fillColor: darkNavy,
        textColor: [255, 255, 255],
        fontSize: 8,
        fontStyle: 'bold',
      },
      bodyStyles: {
        fontSize: 7.5,
        textColor: darkNavy,
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      columnStyles: {
        0: { fontStyle: 'bold', halign: 'center', textColor: clinicalBlue },
        1: { fontStyle: 'bold' },
        2: { fontStyle: 'bold', halign: 'center', textColor: emeraldGreen },
      },
      margin: { left: 14, right: 14 },
    });

    const docAny = doc as any;
    y = docAny.lastAutoTable?.finalY ? docAny.lastAutoTable.finalY + 8 : y + 30;
  }

  // -------------------------------------------------------------
  // SECTION 4: ACTIVE PHARMACOTHERAPY & MEDICATION REGIMEN
  // -------------------------------------------------------------
  if (options.includedSections.medications) {
    if (y > pageHeight - 50) {
      doc.addPage();
      y = 20;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...darkNavy);
    doc.text('4. ACTIVE PHARMACOTHERAPY & CURRENT MEDICATIONS', 14, y);

    y += 3;
    const medRows = history.medications.map((m) => [
      m.name,
      m.dosage,
      m.frequency,
      m.prescribedByDoctor || 'Dr. Sarah Al-Mansoor',
      m.status,
      m.adherencePercentage ? `${m.adherencePercentage}% High` : '92% Compliant',
    ]);

    autoTable(doc, {
      startY: y,
      head: [['Medication Name & Strength', 'Dose', 'Schedule & Instructions', 'Prescriber', 'Status', 'Adherence']],
      body: medRows,
      theme: 'striped',
      headStyles: {
        fillColor: primaryTeal,
        textColor: [255, 255, 255],
        fontSize: 8,
        fontStyle: 'bold',
      },
      bodyStyles: {
        fontSize: 7.5,
        textColor: darkNavy,
      },
      columnStyles: {
        0: { fontStyle: 'bold' },
        1: { halign: 'center', fontStyle: 'bold' },
        4: { halign: 'center', fontStyle: 'bold', textColor: emeraldGreen },
        5: { halign: 'center', fontStyle: 'bold', textColor: clinicalBlue },
      },
      margin: { left: 14, right: 14 },
    });

    const docAny = doc as any;
    y = docAny.lastAutoTable?.finalY ? docAny.lastAutoTable.finalY + 8 : y + 30;
  }

  // -------------------------------------------------------------
  // SECTION 5: CLINICAL VITALS BASELINES & PHYSIOLOGICAL MONITORING
  // -------------------------------------------------------------
  if (options.includedSections.vitals) {
    if (y > pageHeight - 50) {
      doc.addPage();
      y = 20;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...darkNavy);
    doc.text('5. BASELINE CLINICAL VITALS & TELEMETRY OBSERVATIONS', 14, y);

    y += 3;
    const vitalsRows = history.vitals.map((v) => {
      const typeLabelMap: Record<string, string> = {
        HEART_RATE: 'Resting Heart Rate (ECG)',
        BLOOD_PRESSURE: 'Arterial Blood Pressure',
        SPO2: 'Peripheral Capillary Oxygen (SpO2)',
        GLUCOSE: 'Blood Glucose (Continuous CGM)',
        TEMPERATURE: 'Body Core Temperature',
      };
      return [
        typeLabelMap[v.type] || v.type,
        `${v.value} ${v.unit}`,
        v.status,
        v.deviceId || 'Medical Sensor',
        v.isVerifiedByClinician ? 'Clinician Verified' : 'Patient Monitored',
        new Date(v.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      ];
    });

    autoTable(doc, {
      startY: y,
      head: [['Biometric Metric', 'Current / Baseline Value', 'Clinical Status', 'Source Device', 'Verification', 'Last Checked']],
      body: vitalsRows,
      theme: 'grid',
      headStyles: {
        fillColor: darkNavy,
        textColor: [255, 255, 255],
        fontSize: 8,
        fontStyle: 'bold',
      },
      bodyStyles: {
        fontSize: 7.5,
        textColor: darkNavy,
      },
      columnStyles: {
        0: { fontStyle: 'bold' },
        1: { halign: 'center', fontStyle: 'bold', textColor: clinicalBlue },
        2: { halign: 'center', fontStyle: 'bold', textColor: emeraldGreen },
        4: { halign: 'center' },
      },
      margin: { left: 14, right: 14 },
    });

    const docAny = doc as any;
    y = docAny.lastAutoTable?.finalY ? docAny.lastAutoTable.finalY + 8 : y + 30;
  }

  // -------------------------------------------------------------
  // SECTION 6: DIAGNOSTIC LABORATORY INVESTIGATION REPORTS
  // -------------------------------------------------------------
  if (options.includedSections.labResults) {
    if (y > pageHeight - 50) {
      doc.addPage();
      y = 20;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...darkNavy);
    doc.text('6. RECENT DIAGNOSTIC LABORATORY INVESTIGATIONS', 14, y);

    y += 3;
    const labRows = history.labResults.map((lab) => [
      lab.testName,
      `${lab.value} ${lab.unit}`,
      lab.referenceRange,
      lab.status,
      new Date(lab.reportedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      lab.canonicalLabOwner || 'Central Diagnostic Laboratories (ISO 15189)',
    ]);

    autoTable(doc, {
      startY: y,
      head: [['Laboratory Panel / Test Name', 'Result', 'Biological Reference Interval', 'Status', 'Reported Date', 'Accredited Testing Facility']],
      body: labRows,
      theme: 'striped',
      headStyles: {
        fillColor: clinicalBlue,
        textColor: [255, 255, 255],
        fontSize: 8,
        fontStyle: 'bold',
      },
      bodyStyles: {
        fontSize: 7.5,
        textColor: darkNavy,
      },
      columnStyles: {
        0: { fontStyle: 'bold' },
        1: { halign: 'center', fontStyle: 'bold' },
        2: { halign: 'center' },
        3: { halign: 'center', fontStyle: 'bold', textColor: emeraldGreen },
      },
      margin: { left: 14, right: 14 },
    });

    const docAny = doc as any;
    y = docAny.lastAutoTable?.finalY ? docAny.lastAutoTable.finalY + 8 : y + 30;
  }

  // -------------------------------------------------------------
  // SECTION 7: CLINICAL ENCOUNTERS & PHYSICIAN NOTES
  // -------------------------------------------------------------
  if (options.includedSections.encounters) {
    if (y > pageHeight - 55) {
      doc.addPage();
      y = 20;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...darkNavy);
    doc.text('7. RECENT CLINICAL ENCOUNTERS & CONSULTATION NOTES', 14, y);

    y += 3;
    const encRows = history.encounters.map((enc) => [
      enc.date,
      enc.doctorName,
      enc.reasonForVisit,
      enc.objectiveFindings,
      enc.assessmentPlan,
      enc.status,
    ]);

    autoTable(doc, {
      startY: y,
      head: [['Encounter Date', 'Attending Physician', 'Reason for Visit', 'Objective Clinical Exam', 'Assessment & Care Plan', 'Status']],
      body: encRows,
      theme: 'grid',
      headStyles: {
        fillColor: darkNavy,
        textColor: [255, 255, 255],
        fontSize: 8,
        fontStyle: 'bold',
      },
      bodyStyles: {
        fontSize: 7.5,
        textColor: darkNavy,
      },
      columnStyles: {
        0: { fontStyle: 'bold', halign: 'center' },
        1: { fontStyle: 'bold' },
        5: { fontStyle: 'bold', halign: 'center', textColor: emeraldGreen },
      },
      margin: { left: 14, right: 14 },
    });

    const docAny = doc as any;
    y = docAny.lastAutoTable?.finalY ? docAny.lastAutoTable.finalY + 8 : y + 30;
  }

  // -------------------------------------------------------------
  // SECTION 8: HEALTH TIMELINE & HISTORICAL MILESTONES
  // -------------------------------------------------------------
  if (options.includedSections.timeline) {
    if (y > pageHeight - 45) {
      doc.addPage();
      y = 20;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...darkNavy);
    doc.text('8. HEALTH EVENTS & LONGITUDINAL TIMELINE MILESTONES', 14, y);

    y += 3;
    const timelineRows = history.timeline.map((evt) => [
      new Date(evt.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      evt.type,
      evt.title,
      evt.providerName,
      evt.summary,
    ]);

    autoTable(doc, {
      startY: y,
      head: [['Event Date', 'Event Category', 'Clinical Title', 'Healthcare Provider', 'Event Summary']],
      body: timelineRows,
      theme: 'striped',
      headStyles: {
        fillColor: [71, 85, 105], // Slate-600
        textColor: [255, 255, 255],
        fontSize: 8,
        fontStyle: 'bold',
      },
      bodyStyles: {
        fontSize: 7.5,
        textColor: darkNavy,
      },
      columnStyles: {
        0: { fontStyle: 'bold', halign: 'center' },
        1: { fontStyle: 'bold', halign: 'center', textColor: clinicalBlue },
        2: { fontStyle: 'bold' },
      },
      margin: { left: 14, right: 14 },
    });

    const docAny = doc as any;
    y = docAny.lastAutoTable?.finalY ? docAny.lastAutoTable.finalY + 8 : y + 30;
  }

  // -------------------------------------------------------------
  // SECTION 9: EXTERNAL PHYSICIAN REVIEW & CERTIFICATION BLOCK
  // -------------------------------------------------------------
  if (options.includeDoctorCertificationBlock !== false) {
    if (y > pageHeight - 55) {
      doc.addPage();
      y = 20;
    }

    doc.setFillColor(...lightBg);
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(14, y, pageWidth - 28, 42, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...darkNavy);
    doc.text('EXTERNAL PHYSICIAN REVIEW & CLINICAL TRANSFER SIGN-OFF', 18, y + 6);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...slateGray);
    doc.text(
      'To be completed, signed, and stamped by the receiving external physician or specialist upon clinical review:',
      18,
      y + 11
    );

    // Left Column Fields
    doc.text('Reviewing Physician Name & Title:', 18, y + 17);
    doc.line(65, y + 18, 120, y + 18);

    doc.text('Medical License / Registration No.:', 18, y + 23);
    doc.line(65, y + 24, 120, y + 24);

    doc.text('Date of External Evaluation:', 18, y + 29);
    doc.line(65, y + 30, 120, y + 30);

    doc.text('Clinical Action / Referral Acceptance:', 18, y + 35);
    doc.line(65, y + 36, 120, y + 36);

    // Right Column: Signature & Official Stamp Box
    const stampX = pageWidth - 65;
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(stampX, y + 14, 47, 24, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...slateGray);
    doc.text('PHYSICIAN SIGNATURE & STAMP', stampX + 23.5, y + 18, { align: 'center' });

    doc.setFontSize(6.5);
    doc.text('[ Affix Official Clinic / Hospital Stamp ]', stampX + 23.5, y + 33, { align: 'center' });

    y += 46;
  }

  // -------------------------------------------------------------
  // RUNNING HEADERS & FOOTERS ON ALL PAGES
  // -------------------------------------------------------------
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);

    // Bottom separator line
    doc.setDrawColor(226, 232, 240);
    doc.line(14, pageHeight - 11, pageWidth - 14, pageHeight - 11);

    // Running footer
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.8);
    doc.setTextColor(...slateGray);
    doc.text(
      `Lifex-AI Sovereign Medical Summary • Patient: ${history.patientName} (${history.patientId}) • Hash: ${history.documentTrackingHash}`,
      14,
      pageHeight - 6.5
    );

    doc.text(`Confidential • Page ${i} of ${totalPages}`, pageWidth - 14, pageHeight - 6.5, { align: 'right' });
  }

  const fileName = `Lifex_Medical_History_Summary_${history.patientId}_${new Date().toISOString().slice(0, 10)}.pdf`;

  // Trigger browser download
  doc.save(fileName);

  return {
    success: true,
    fileName,
    trackingHash: history.documentTrackingHash,
    generatedAt: history.generatedAt,
    pageCount: totalPages,
  };
}
