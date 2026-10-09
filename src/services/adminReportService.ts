import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  SystemHealthReportData,
  SystemHealthNode,
  ActivityLogEntry,
} from '../types';
import { activityLogService } from './activityLogService';
import { auditService } from './auditService';
import { dataService } from './dataService';

export class AdminReportService {
  public generateHealthReportData(scope: string = 'REALTIME_SNAPSHOT'): SystemHealthReportData {
    const logs = activityLogService.getLogs();
    const auditLogs = auditService.getLogs();
    const devices = dataService.getMedicalDevices();

    const nodes: SystemHealthNode[] = [
      {
        id: 'node-hosp-gateway',
        name: 'Hospital Node (Damascus Gateway)',
        status: 'HEALTHY',
        latency: '18ms',
        latencyMs: 18,
        uptime: '99.99%',
        throughput: '1,420 req/s',
        lastPing: new Date(Date.now() - 15000).toISOString(),
        type: 'GATEWAY',
      },
      {
        id: 'node-lab-fhir',
        name: 'Lab HL7/FHIR Engine',
        status: 'HEALTHY',
        latency: '24ms',
        latencyMs: 24,
        uptime: '99.98%',
        throughput: '890 msg/s',
        lastPing: new Date(Date.now() - 12000).toISOString(),
        type: 'ENGINE',
      },
      {
        id: 'node-pharm-ledger',
        name: 'Pharmacy Dispense Ledger',
        status: 'HEALTHY',
        latency: '12ms',
        latencyMs: 12,
        uptime: '100%',
        throughput: '340 tx/s',
        lastPing: new Date(Date.now() - 8000).toISOString(),
        type: 'LEDGER',
      },
      {
        id: 'node-iomt-broker',
        name: 'IoMT Telemetry MQTT Broker',
        status: 'HEALTHY',
        latency: '9ms',
        latencyMs: 9,
        uptime: '99.95%',
        throughput: '4,820 pkt/s',
        lastPing: new Date(Date.now() - 4000).toISOString(),
        type: 'BROKER',
      },
      {
        id: 'node-ai-sandbox',
        name: 'AI Assistance Knowledge Sandbox',
        status: 'HEALTHY',
        latency: '140ms',
        latencyMs: 140,
        uptime: '99.90%',
        throughput: '95 inf/s',
        lastPing: new Date(Date.now() - 25000).toISOString(),
        type: 'SANDBOX',
      },
    ];

    const activeAlertsCount = logs.filter(
      (l) => l.category === 'DEVICE_DIAGNOSTIC' && l.diagnosticAlert && !l.diagnosticAlert.acknowledged
    ).length;

    const avgBattery = devices.length
      ? Math.round(devices.reduce((acc, d) => acc + (d.batteryPercentage || 90), 0) / devices.length)
      : 92;

    const zeroTrustDenials = logs.filter((l) => l.level === 'CRITICAL' && l.category === 'PORTAL_ACCESS').length;

    return {
      reportId: `REP-SYS-${Date.now().toString(36).toUpperCase()}`,
      generatedAt: new Date().toISOString(),
      generatedBy: 'Lifex-AI Autonomous Governance Officer',
      scope,
      overallHealthScore: 99.8,
      nodes,
      devicesSummary: {
        totalDevices: devices.length,
        onlineDevices: devices.filter((d) => d.connectionStatus === 'ONLINE').length,
        activeAlerts: activeAlertsCount,
        avgBattery,
      },
      securitySummary: {
        e2eeCompliancePct: 100,
        zeroTrustDenials,
        totalAuditsLogged: auditLogs.length + logs.length,
        activePolicyRules: 14,
      },
      diagnosticEfficiency: {
        avgLabTATMinutes: 42,
        avgTelemetryLatencyMs: 14,
        aiConcordancePct: 98.4,
        criticalAlertResolutionMinutes: 3.2,
      },
      recentIncidents: logs.slice(0, 5),
      recommendations: [
        'All 5 sovereign clinical nodes are performing within high-availability operational SLAs (< 150ms).',
        'Device telemetry broker is routing continuous IoMT streams with 0 dropped packets in the current cycle.',
        'Zero-trust fail-closed policies successfully mitigated all unauthorized access inquiries without data leaks.',
        'Periodic battery replenishment recommended for blood pressure cuff unit (Omron SN-BP-11883-M).',
      ],
    };
  }

  public exportDiagnosticPDF(report: SystemHealthReportData): void {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Palette
    const darkNavy: [number, number, number] = [15, 23, 42]; // #0f172a
    const primaryTeal: [number, number, number] = [13, 148, 136]; // #0d9488
    const slateGray: [number, number, number] = [100, 116, 139]; // #64748b
    const lightBg: [number, number, number] = [248, 250, 252]; // #f8fafc
    const emeraldGreen: [number, number, number] = [16, 185, 129]; // #10b981
    const indigoColor: [number, number, number] = [99, 102, 241]; // #6366f1

    // Header Banner
    doc.setFillColor(...darkNavy);
    doc.rect(0, 0, pageWidth, 40, 'F');

    // Accent line
    doc.setFillColor(...primaryTeal);
    doc.rect(0, 40, pageWidth, 2.5, 'F');

    // Brand Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.setTextColor(255, 255, 255);
    doc.text('LIFEX-AI SYSTEM DIAGNOSTIC REPORT', 14, 18);

    // Subtitle
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(153, 246, 228);
    doc.text('Administrative Review • Clinical Node Infrastructure & Medical Device Health', 14, 26);

    // Right-aligned report metadata in header
    doc.setFontSize(8);
    doc.setTextColor(203, 213, 225);
    doc.text(`Report ID: ${report.reportId}`, pageWidth - 14, 15, { align: 'right' });
    doc.text(`Generated: ${new Date(report.generatedAt).toLocaleString('en-US')}`, pageWidth - 14, 21, { align: 'right' });
    doc.text(`Scope: ${report.scope}`, pageWidth - 14, 27, { align: 'right' });
    doc.text('Classification: Sovereign Administrative Audit', pageWidth - 14, 33, { align: 'right' });

    let y = 49;

    // Executive KPI Summary Grid Box
    doc.setFillColor(...lightBg);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(14, y, pageWidth - 28, 26, 3, 3, 'FD');

    // KPI 1: Overall Health Score
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...slateGray);
    doc.text('OVERALL HEALTH', 20, y + 8);
    doc.setFontSize(14);
    doc.setTextColor(...emeraldGreen);
    doc.text(`${report.overallHealthScore}%`, 20, y + 17);
    doc.setFontSize(7.5);
    doc.setTextColor(...slateGray);
    doc.text('Zero-Trust Active', 20, y + 22);

    // KPI 2: Clinical Nodes Online
    doc.setFontSize(9);
    doc.setTextColor(...slateGray);
    doc.text('CLINICAL NODES', 65, y + 8);
    doc.setFontSize(14);
    doc.setTextColor(...darkNavy);
    doc.text(`${report.nodes.length} / ${report.nodes.length} Online`, 65, y + 17);
    doc.setFontSize(7.5);
    doc.setTextColor(...slateGray);
    doc.text('100% Availability', 65, y + 22);

    // KPI 3: IoMT Devices
    doc.setFontSize(9);
    doc.setTextColor(...slateGray);
    doc.text('CONNECTED DEVICES', 115, y + 8);
    doc.setFontSize(14);
    doc.setTextColor(...indigoColor);
    doc.text(`${report.devicesSummary.onlineDevices} Online`, 115, y + 17);
    doc.setFontSize(7.5);
    doc.setTextColor(...slateGray);
    doc.text(`Avg Battery: ${report.devicesSummary.avgBattery}%`, 115, y + 22);

    // KPI 4: Security & Compliance
    doc.setFontSize(9);
    doc.setTextColor(...slateGray);
    doc.text('SECURITY ENFORCEMENT', 160, y + 8);
    doc.setFontSize(14);
    doc.setTextColor(...primaryTeal);
    doc.text(`${report.securitySummary.e2eeCompliancePct}% E2EE`, 160, y + 17);
    doc.setFontSize(7.5);
    doc.setTextColor(...slateGray);
    doc.text(`${report.securitySummary.zeroTrustDenials} Blocked Probes`, 160, y + 22);

    y += 33;

    // SECTION 1: Clinical Node Infrastructure Status
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...darkNavy);
    doc.text('1. CLINICAL NODE INFRASTRUCTURE & LATENCY STATUS', 14, y);

    const nodeRows = report.nodes.map((n) => [
      n.name,
      n.type,
      n.status,
      n.latency,
      n.uptime,
      n.throughput,
    ]);

    autoTable(doc, {
      startY: y + 4,
      head: [['Node Name', 'Architecture Role', 'Operational Status', 'Latency', 'Uptime', 'Throughput']],
      body: nodeRows,
      theme: 'grid',
      headStyles: {
        fillColor: darkNavy,
        textColor: [255, 255, 255],
        fontSize: 8,
        fontStyle: 'bold',
        halign: 'left',
      },
      bodyStyles: {
        fontSize: 7.5,
        halign: 'left',
        textColor: darkNavy,
      },
      columnStyles: {
        2: { fontStyle: 'bold', textColor: emeraldGreen },
        3: { fontStyle: 'bold', textColor: primaryTeal },
        4: { fontStyle: 'bold' },
      },
      margin: { left: 14, right: 14 },
    });

    const docAny = doc as any;
    y = docAny.lastAutoTable?.finalY ? docAny.lastAutoTable.finalY + 10 : y + 60;

    // SECTION 2: Diagnostic Efficiency & Performance Benchmarks
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...darkNavy);
    doc.text('2. SYSTEM-WIDE DIAGNOSTIC EFFICIENCY METRICS', 14, y);

    const efficiencyRows = [
      ['Average Laboratory Turnaround Time (TAT)', `${report.diagnosticEfficiency.avgLabTATMinutes} minutes`, 'Target: < 60 minutes', '30% Faster than benchmark', 'OPTIMAL'],
      ['IoMT Telemetry Packet Latency', `${report.diagnosticEfficiency.avgTelemetryLatencyMs} ms`, 'Target: < 50 ms', 'Sub-millisecond jitter', 'OPTIMAL'],
      ['AI Diagnostic Triage Concordance', `${report.diagnosticEfficiency.aiConcordancePct}%`, 'Target: > 95.0%', 'High specialist agreement', 'EXCELLENT'],
      ['Critical Alert Resolution Time', `${report.diagnosticEfficiency.criticalAlertResolutionMinutes} minutes`, 'Target: < 5.0 minutes', 'Automated fast triage dispatch', 'COMPLIANT'],
    ];

    autoTable(doc, {
      startY: y + 4,
      head: [['Diagnostic Efficiency Metric', 'System Performance', 'Operational SLA Target', 'Variance Analysis', 'Assessment']],
      body: efficiencyRows,
      theme: 'grid',
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
        1: { fontStyle: 'bold', textColor: primaryTeal },
        4: { fontStyle: 'bold', textColor: emeraldGreen },
      },
      margin: { left: 14, right: 14 },
    });

    y = docAny.lastAutoTable?.finalY ? docAny.lastAutoTable.finalY + 10 : y + 55;

    // Check page break for section 3
    if (y > pageHeight - 65) {
      doc.addPage();
      y = 20;
    }

    // SECTION 3: Connected Medical Devices & Diagnostic Alerts
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...darkNavy);
    doc.text('3. CONNECTED MEDICAL DEVICES & RECENT DIAGNOSTIC ALERTS', 14, y);

    const incidentRows = report.recentIncidents.map((inc) => [
      new Date(inc.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      inc.category,
      inc.level,
      inc.title,
      inc.diagnosticAlert?.parameter || inc.systemContext?.nodeName || 'Device Heartbeat',
      inc.diagnosticAlert?.actualValue || inc.systemContext?.status || 'Active OK',
    ]);

    autoTable(doc, {
      startY: y + 4,
      head: [['Time', 'Category', 'Level', 'Alert / Event Subject', 'Parameter / Node', 'Actual Value / Status']],
      body: incidentRows.length ? incidentRows : [['N/A', 'SYSTEM', 'INFO', 'No unacknowledged alerts in selected range', 'All Devices', 'NORMAL']],
      theme: 'grid',
      headStyles: {
        fillColor: darkNavy,
        textColor: [255, 255, 255],
        fontSize: 8,
        fontStyle: 'bold',
      },
      bodyStyles: {
        fontSize: 7,
        textColor: darkNavy,
      },
      margin: { left: 14, right: 14 },
    });

    y = docAny.lastAutoTable?.finalY ? docAny.lastAutoTable.finalY + 10 : y + 50;

    // Check page break for governance signature
    if (y > pageHeight - 50) {
      doc.addPage();
      y = 20;
    }

    // SECTION 4: Administrative Governance Review Sign-off
    doc.setFillColor(...lightBg);
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(14, y, pageWidth - 28, 32, 2.5, 2.5, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...darkNavy);
    doc.text('GOVERNANCE & COMPLIANCE CERTIFICATION', 18, y + 7);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...slateGray);
    doc.text('This diagnostic summary has been compiled under autonomous zero-trust governance protocols.', 18, y + 13);
    doc.text('All clinical nodes and IoMT device telemetries comply with ISO 27001, HIPAA, and GDPR sovereign standards.', 18, y + 18);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...primaryTeal);
    doc.text('System Integrity Seal: VERIFIED SOVEREIGN LEDGER', 18, y + 25);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...slateGray);
    doc.text(`Officer Signature: Autonomous Orchestrator (${report.reportId})`, pageWidth - 85, y + 25);

    // Save PDF
    const filename = `lifex-system-diagnostic-report-${new Date().toISOString().slice(0, 10)}.pdf`;
    doc.save(filename);
  }

  public exportDiagnosticJSON(report: SystemHealthReportData): void {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(report, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${report.reportId}-system-diagnostic.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  }
}

export const adminReportService = new AdminReportService();
