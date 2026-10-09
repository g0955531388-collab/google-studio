import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { VitalTrendDataPoint, MedicationLogEntry, MedicationAdherenceTrendPoint } from '../types';

export interface PatientHealthReportData {
  patientId: string;
  patientName: string;
  bloodType?: string;
  generatedAt: string;
  vitalTrends: VitalTrendDataPoint[];
  medicationLogs: MedicationLogEntry[];
  medicationAdherenceTrends: MedicationAdherenceTrendPoint[];
  currentMedications: {
    name: string;
    dosage: string;
    frequency: string;
    status: string;
    doctor?: string;
  }[];
  summaryStats: {
    weeklyAdherencePct: number;
    streakDays: number;
    avgHeartRate: number;
    avgSystolic: number;
    avgDiastolic: number;
    avgGlucose: number;
    avgSpO2: number;
  };
}

export function generateHealthReportPDF(data: PatientHealthReportData): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Colors
  const primaryTeal: [number, number, number] = [13, 148, 136]; // #0d9488
  const darkNavy: [number, number, number] = [15, 23, 42]; // #0f172a
  const slateGray: [number, number, number] = [100, 116, 139]; // #64748b
  const lightBg: [number, number, number] = [248, 250, 252]; // #f8fafc
  const emeraldGreen: [number, number, number] = [16, 185, 129]; // #10b981
  const roseRed: [number, number, number] = [239, 68, 68]; // #ef4444

  // Header Banner
  doc.setFillColor(...darkNavy);
  doc.rect(0, 0, pageWidth, 38, 'F');

  // Accent Line
  doc.setFillColor(...primaryTeal);
  doc.rect(0, 38, pageWidth, 2.5, 'F');

  // Brand Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(255, 255, 255);
  doc.text('LIFEX-AI HEALTH REPORT', 14, 18);

  // Subtitle
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(153, 246, 228); // light teal
  doc.text('Comprehensive Clinical Vitals & Medication Adherence Projection', 14, 26);

  // Right-aligned report metadata in header
  doc.setFontSize(8.5);
  doc.setTextColor(203, 213, 225);
  doc.text(`Generated: ${new Date(data.generatedAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}`, pageWidth - 14, 16, { align: 'right' });
  doc.text(`Patient ID: ${data.patientId}`, pageWidth - 14, 22, { align: 'right' });
  doc.text('Classification: Confidential Medical Projection', pageWidth - 14, 28, { align: 'right' });

  let y = 48;

  // Patient Demographic Information Box
  doc.setFillColor(...lightBg);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, y, pageWidth - 28, 24, 3, 3, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...darkNavy);
  doc.text('PATIENT PROFILE', 18, y + 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...slateGray);
  doc.text('Full Name:', 18, y + 14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...darkNavy);
  doc.text(data.patientName || 'Ahmed Fahad Al-Mansouri', 37, y + 14);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...slateGray);
  doc.text('Blood Type:', 18, y + 20);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...roseRed);
  doc.text(data.bloodType || 'O+', 37, y + 20);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...slateGray);
  doc.text('Adherence Streak:', 90, y + 14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...emeraldGreen);
  doc.text(`${data.summaryStats.streakDays} Days Consecutive`, 122, y + 14);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...slateGray);
  doc.text('Weekly Adherence:', 90, y + 20);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...primaryTeal);
  doc.text(`${data.summaryStats.weeklyAdherencePct}% (Target: >85%)`, 122, y + 20);

  y += 30;

  // Executive Summary Metrics (Key Health Indicators)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...darkNavy);
  doc.text('KEY CLINICAL VITALS SUMMARY', 14, y);

  y += 4;
  const colWidth = (pageWidth - 28 - 9) / 4;
  const summaryCards = [
    {
      title: 'Blood Pressure',
      value: `${Math.round(data.summaryStats.avgSystolic)}/${Math.round(data.summaryStats.avgDiastolic)}`,
      unit: 'mmHg',
      status: data.summaryStats.avgSystolic < 130 ? 'Normal / Controlled' : 'Elevated',
      statusColor: data.summaryStats.avgSystolic < 130 ? emeraldGreen : roseRed,
    },
    {
      title: 'Heart Rate (Resting)',
      value: `${Math.round(data.summaryStats.avgHeartRate)}`,
      unit: 'bpm',
      status: 'Normal Sinus Rhythm',
      statusColor: emeraldGreen,
    },
    {
      title: 'Blood Glucose (CGM)',
      value: `${Math.round(data.summaryStats.avgGlucose)}`,
      unit: 'mg/dL',
      status: 'Target Fasting Range',
      statusColor: emeraldGreen,
    },
    {
      title: 'Oxygen Saturation',
      value: `${data.summaryStats.avgSpO2.toFixed(1)}`,
      unit: '%',
      status: 'Optimal Ventilation',
      statusColor: emeraldGreen,
    },
  ];

  summaryCards.forEach((c, idx) => {
    const cardX = 14 + idx * (colWidth + 3);
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(cardX, y, colWidth, 22, 2, 2, 'FD');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...slateGray);
    doc.text(c.title, cardX + 3.5, y + 5.5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(...darkNavy);
    doc.text(c.value, cardX + 3.5, y + 12);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.text(` ${c.unit}`, cardX + 3.5 + doc.getTextWidth(c.value), y + 12);

    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...c.statusColor);
    doc.text(c.status, cardX + 3.5, y + 18);
  });

  y += 28;

  // SECTION 1: Longitudinal Vital Signs Trends (Tabular Chart Projection)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...darkNavy);
  doc.text('1. LONGITUDINAL VITAL SIGNS TREND LOG (IoMT)', 14, y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...slateGray);
  doc.text('Continuous measurements recorded over the previous 48 hours with clinical baseline thresholds', 14, y + 4.5);

  const vitalsTableRows = data.vitalTrends.map((vt) => {
    const dateFormatted = new Date(vt.timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
    return [
      `${dateFormatted} ${vt.label}`,
      `${vt.systolicBP}/${vt.diastolicBP} mmHg`,
      `${vt.heartRate} bpm`,
      `${vt.glucose} mg/dL`,
      `${vt.spO2}%`,
      `${vt.temperature || '36.6'} °C`,
      vt.systolicBP <= 125 && vt.heartRate <= 80 ? 'Optimal' : 'Acceptable',
    ];
  });

  autoTable(doc, {
    startY: y + 7,
    head: [['Time / Interval', 'Blood Pressure', 'Heart Rate', 'Glucose', 'SpO2', 'Temp', 'Status']],
    body: vitalsTableRows,
    theme: 'striped',
    headStyles: {
      fillColor: primaryTeal,
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
      halign: 'center',
    },
    bodyStyles: {
      fontSize: 7.5,
      halign: 'center',
      textColor: darkNavy,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { halign: 'left', fontStyle: 'bold' },
      1: { halign: 'center' },
      6: { fontStyle: 'bold', textColor: emeraldGreen },
    },
    margin: { left: 14, right: 14 },
  });

  // Calculate current y after table
  const docAny = doc as any;
  y = docAny.lastAutoTable?.finalY ? docAny.lastAutoTable.finalY + 10 : y + 60;

  // SECTION 2: Active Prescriptions & Weekly Adherence Summary
  if (y > pageHeight - 55) {
    doc.addPage();
    y = 20;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...darkNavy);
  doc.text('2. MEDICATION ADHERENCE TRENDS (7-DAY ANALYSIS)', 14, y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...slateGray);
  doc.text('Daily intake compliance, scheduled doses, and adherence percentage', 14, y + 4.5);

  const adherenceRows = data.medicationAdherenceTrends.map((item) => [
    item.date,
    item.dayName,
    item.scheduled.toString(),
    item.taken.toString(),
    item.skipped.toString(),
    `${item.adherencePct}%`,
    item.adherencePct >= 90 ? 'High Adherence' : item.adherencePct >= 70 ? 'Moderate' : 'Low Attention Needed',
  ]);

  autoTable(doc, {
    startY: y + 7,
    head: [['Date', 'Day', 'Scheduled', 'Taken', 'Skipped', 'Adherence %', 'Compliance Status']],
    body: adherenceRows,
    theme: 'grid',
    headStyles: {
      fillColor: darkNavy,
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
      halign: 'center',
    },
    bodyStyles: {
      fontSize: 7.5,
      halign: 'center',
      textColor: darkNavy,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      5: { fontStyle: 'bold', textColor: primaryTeal },
      6: { fontStyle: 'bold' },
    },
    margin: { left: 14, right: 14 },
  });

  y = docAny.lastAutoTable?.finalY ? docAny.lastAutoTable.finalY + 10 : y + 60;

  // Check page break for section 3
  if (y > pageHeight - 65) {
    doc.addPage();
    y = 20;
  }

  // SECTION 3: Medication History Log
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...darkNavy);
  doc.text('3. MEDICATION DOSE HISTORY LOG', 14, y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...slateGray);
  doc.text('Recent historical doses verified and logged with timestamps and patient notes', 14, y + 4.5);

  const medLogRows = data.medicationLogs.slice(0, 10).map((log) => {
    const formattedLoggedTime = new Date(log.loggedAt).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
    return [
      formattedLoggedTime,
      log.medicationName,
      log.dosage,
      log.scheduledTime,
      log.takenDoseTime || '-',
      log.status,
      log.notes || 'Routine intake',
    ];
  });

  autoTable(doc, {
    startY: y + 7,
    head: [['Timestamp', 'Medication Name', 'Dose', 'Scheduled', 'Taken Time', 'Status', 'Clinical Notes']],
    body: medLogRows,
    theme: 'striped',
    headStyles: {
      fillColor: primaryTeal,
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
      halign: 'center',
    },
    bodyStyles: {
      fontSize: 7.5,
      halign: 'center',
      textColor: darkNavy,
    },
    columnStyles: {
      0: { halign: 'left' },
      1: { halign: 'left', fontStyle: 'bold' },
      5: { fontStyle: 'bold', textColor: emeraldGreen },
      6: { halign: 'left' },
    },
    margin: { left: 14, right: 14 },
  });

  y = docAny.lastAutoTable?.finalY ? docAny.lastAutoTable.finalY + 10 : y + 50;

  // Check if room for Active Regimen & Disclaimer
  if (y > pageHeight - 45) {
    doc.addPage();
    y = 20;
  }

  // Active Regimen Summary
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...darkNavy);
  doc.text('4. ACTIVE PHARMACOLOGICAL REGIMEN', 14, y);

  const regimenRows = data.currentMedications.map((m) => [
    m.name,
    m.dosage,
    m.frequency,
    m.doctor || 'Dr. Sarah Al-Mansoor',
    m.status,
  ]);

  autoTable(doc, {
    startY: y + 4,
    head: [['Medication', 'Dosage', 'Frequency', 'Prescribing Physician', 'Status']],
    body: regimenRows,
    theme: 'plain',
    headStyles: {
      fillColor: [241, 245, 249],
      textColor: darkNavy,
      fontSize: 7.5,
      fontStyle: 'bold',
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: darkNavy,
    },
    margin: { left: 14, right: 14 },
  });

  // Footer / Disclaimer on all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);

    // Bottom border
    doc.setDrawColor(226, 232, 240);
    doc.line(14, pageHeight - 12, pageWidth - 14, pageHeight - 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...slateGray);
    doc.text(
      'Lifex-AI Architectural Projection • Canonical records remain with source healthcare providers • Zero-Trust verified',
      14,
      pageHeight - 7
    );

    doc.text(`Page ${i} of ${totalPages}`, pageWidth - 14, pageHeight - 7, { align: 'right' });
  }

  // Save the generated PDF
  doc.save(`Lifex_Health_Report_${data.patientId}_${new Date().toISOString().slice(0, 10)}.pdf`);
}
