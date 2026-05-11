const cds = require('@sap/cds');

module.exports = cds.service.impl(async function () {
  const { Employees, Certifications, LearningProgress } = this.entities;

  // ─── Helper: compute status from expiry date ────────────────────────────────
  function computeStatus(expiryDate) {
    if (!expiryDate) return 'ACTIVE';
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiry = new Date(expiryDate);
    const in60 = new Date(today);
    in60.setDate(in60.getDate() + 60);
    if (expiry < today) return 'EXPIRED';
    if (expiry < in60) return 'EXPIRING_SOON';
    return 'ACTIVE';
  }

  function daysBetween(from, to) {
    return Math.ceil((new Date(to) - new Date(from)) / (1000 * 60 * 60 * 24));
  }

  // ─── Auto-update status on READ ─────────────────────────────────────────────
  this.after('READ', Certifications, (certs) => {
    const list = Array.isArray(certs) ? certs : [certs];
    list.forEach((c) => {
      if (c && c.expiryDate) {
        c.status = computeStatus(c.expiryDate);
      }
    });
  });

  // ─── getDashboardStats ───────────────────────────────────────────────────────
  this.on('getDashboardStats', async () => {
    const today = new Date().toISOString().split('T')[0];

    const employees = await SELECT.from(Employees).where({ isActive: true });
    const totalEmployees = employees.length;

    const allCerts = await SELECT.from(Certifications);

    let activeCerts = 0;
    let expiredCerts = 0;
    let expiringSoonCerts = 0;
    let totalInvestment = 0;
    const employeesWithActiveCert = new Set();

    for (const c of allCerts) {
      const status = computeStatus(c.expiryDate);
      if (status === 'ACTIVE') {
        activeCerts++;
        if (c.employee_ID) employeesWithActiveCert.add(c.employee_ID);
      } else if (status === 'EXPIRED') {
        expiredCerts++;
      } else if (status === 'EXPIRING_SOON') {
        expiringSoonCerts++;
        if (c.employee_ID) employeesWithActiveCert.add(c.employee_ID);
      }
      if (c.renewalCost) totalInvestment += parseFloat(c.renewalCost);
    }

    const inProgressCerts = await SELECT.from(LearningProgress).where({ status: 'IN_PROGRESS' });
    const coveragePercent =
      totalEmployees > 0
        ? parseFloat(((employeesWithActiveCert.size / totalEmployees) * 100).toFixed(2))
        : 0;

    return {
      totalEmployees,
      totalCerts: allCerts.length,
      activeCerts,
      expiredCerts,
      expiringSoonCerts,
      inProgressCerts: inProgressCerts.length,
      coveragePercent,
      totalInvestment: parseFloat(totalInvestment.toFixed(2)),
    };
  });

  // ─── getSkillsCoverage ───────────────────────────────────────────────────────
  this.on('getSkillsCoverage', async () => {
    const employees = await SELECT.from(Employees).where({ isActive: true });
    const totalEmployees = employees.length;
    const allCerts = await SELECT.from(Certifications);

    const moduleMap = {};

    for (const c of allCerts) {
      const mod = c.certModule || 'OTHER';
      if (!moduleMap[mod]) {
        moduleMap[mod] = { certifiedEmployees: new Set(), expiringEmployees: new Set() };
      }
      const status = computeStatus(c.expiryDate);
      if ((status === 'ACTIVE' || status === 'EXPIRING_SOON') && c.employee_ID) {
        moduleMap[mod].certifiedEmployees.add(c.employee_ID);
      }
      if (status === 'EXPIRING_SOON' && c.employee_ID) {
        moduleMap[mod].expiringEmployees.add(c.employee_ID);
      }
    }

    return Object.entries(moduleMap).map(([moduleArea, data]) => {
      const certifiedCount = data.certifiedEmployees.size;
      const expiringCount = data.expiringEmployees.size;
      const coveragePercent =
        totalEmployees > 0
          ? parseFloat(((certifiedCount / totalEmployees) * 100).toFixed(2))
          : 0;
      return { moduleArea, certifiedCount, expiringCount, totalEmployees, coveragePercent };
    });
  });

  // ─── getExpiryAlerts ────────────────────────────────────────────────────────
  this.on('getExpiryAlerts', async (req) => {
    const daysAhead = req.data.daysAhead || 60;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const cutoff = new Date(today);
    cutoff.setDate(cutoff.getDate() + daysAhead);

    const allCerts = await SELECT.from(Certifications).columns(
      'ID', 'certName', 'expiryDate', 'employee_ID'
    );
    const employees = await SELECT.from(Employees).columns('ID', 'firstName', 'lastName');
    const empMap = {};
    employees.forEach((e) => {
      empMap[e.ID] = `${e.firstName} ${e.lastName}`;
    });

    const alerts = [];
    for (const c of allCerts) {
      if (!c.expiryDate) continue;
      const expiry = new Date(c.expiryDate);
      if (expiry <= cutoff) {
        const daysRemaining = daysBetween(today, expiry);
        alerts.push({
          employeeName: empMap[c.employee_ID] || 'Unknown',
          certName: c.certName,
          expiryDate: c.expiryDate,
          daysRemaining,
          status: computeStatus(c.expiryDate),
        });
      }
    }

    alerts.sort((a, b) => a.daysRemaining - b.daysRemaining);
    return alerts;
  });
});
