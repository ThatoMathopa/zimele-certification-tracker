sap.ui.define([
  'sap/ui/core/mvc/Controller',
  'sap/ui/model/json/JSONModel',
  'sap/m/MessageToast'
], function (Controller, JSONModel, MessageToast) {
  'use strict';

  return Controller.extend('zimele.certtracker.controller.Dashboard', {

    onInit: function () {
      var oState = new JSONModel({
        totalEmployees: 0,
        totalCerts: 0,
        activeCerts: 0,
        expiredCerts: 0,
        expiringSoonCerts: 0,
        inProgressCerts: 0,
        coveragePercent: 0,
        totalInvestment: 0,
        skillsCoverage: [],
        expiryAlerts: []
      });
      this.getView().setModel(oState, 'state');

      this.getOwnerComponent().getRouter()
        .getRoute('Dashboard')
        .attachPatternMatched(this._onRouteMatched, this);
    },

    _onRouteMatched: function () {
      this._loadDashboard();
    },

    _loadDashboard: function () {
      var oModel = this.getView().getModel();
      var oState = this.getView().getModel('state');

      // getDashboardStats
      oModel.bindContext('/getDashboardStats(...)').requestObject().then(function (oData) {
        oState.setProperty('/totalEmployees', oData.totalEmployees || 0);
        oState.setProperty('/totalCerts', oData.totalCerts || 0);
        oState.setProperty('/activeCerts', oData.activeCerts || 0);
        oState.setProperty('/expiredCerts', oData.expiredCerts || 0);
        oState.setProperty('/expiringSoonCerts', oData.expiringSoonCerts || 0);
        oState.setProperty('/inProgressCerts', oData.inProgressCerts || 0);
        oState.setProperty('/coveragePercent', oData.coveragePercent || 0);
        oState.setProperty('/totalInvestment', oData.totalInvestment || 0);
      }).catch(function (oErr) {
        console.error('getDashboardStats failed:', oErr);
      });

      // getSkillsCoverage
      oModel.bindContext('/getSkillsCoverage(...)').requestObject().then(function (oData) {
        var aList = (oData && oData.value) ? oData.value : (Array.isArray(oData) ? oData : []);
        aList.sort(function (a, b) { return b.coveragePercent - a.coveragePercent; });
        oState.setProperty('/skillsCoverage', aList);
      }).catch(function (oErr) {
        console.error('getSkillsCoverage failed:', oErr);
      });

      // getExpiryAlerts
      oModel.bindContext('/getExpiryAlerts(daysAhead=60)').requestObject().then(function (oData) {
        var aList = (oData && oData.value) ? oData.value : (Array.isArray(oData) ? oData : []);
        oState.setProperty('/expiryAlerts', aList);
      }).catch(function (oErr) {
        console.error('getExpiryAlerts failed:', oErr);
      });
    },

    // ── Formatters ─────────────────────────────────────────────────────────────

    formatPercent: function (v) {
      if (v === null || v === undefined) return '0%';
      return parseFloat(v).toFixed(1) + '%';
    },

    formatCurrency: function (v) {
      if (v === null || v === undefined) return 'R 0';
      return 'R ' + parseFloat(v).toLocaleString('en-ZA', { minimumFractionDigits: 0 });
    },

    formatCoverageState: function (v) {
      var pct = parseFloat(v) || 0;
      if (pct >= 60) return 'Success';
      if (pct >= 30) return 'Warning';
      return 'Error';
    },

    formatCoverageBar: function (v) {
      var pct = Math.min(parseFloat(v) || 0, 100);
      var cls = pct >= 60 ? 'cover-high' : pct >= 30 ? 'cover-mid' : 'cover-low';
      return '<div class="coverageBar" style="margin-top:4px"><div class="coverageBarFill ' + cls + '" style="width:' + pct + '%"></div></div>';
    },

    formatAlertState: function (days) {
      var d = parseInt(days, 10);
      if (isNaN(d) || d < 0) return 'Error';
      if (d <= 30) return 'Error';
      if (d <= 60) return 'Warning';
      return 'None';
    },

    // ── Navigation ─────────────────────────────────────────────────────────────

    onAddCertification: function () {
      this.getOwnerComponent().getRouter().navTo('AddCertification');
    },

    onNavToEmployees: function () {
      this.getOwnerComponent().getRouter().navTo('Employees');
    },

    onExportReport: function () {
      var oModel = this.getView().getModel();
      oModel.requestContexts('/Certifications', {
        $expand: 'employee',
        $orderby: 'expiryDate asc'
      }).then(function (aContexts) {
        var aData = aContexts.map(function (ctx) { return ctx.getObject(); });
        var aRows = [
          ['Employee', 'Cert Code', 'Cert Name', 'Module', 'Issue Date', 'Expiry Date', 'Status', 'Renewal Cost (ZAR)']
        ];
        aData.forEach(function (c) {
          aRows.push([
            c.employee ? (c.employee.firstName + ' ' + c.employee.lastName) : '',
            c.certCode || '', c.certName || '', c.certModule || '',
            c.issueDate || '', c.expiryDate || '', c.status || '',
            c.renewalCost || ''
          ]);
        });
        var csv = aRows.map(function (r) { return r.join(','); }).join('\n');
        var blob = new Blob([csv], { type: 'text/csv' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url; a.download = 'zimele_certifications.csv'; a.click();
        URL.revokeObjectURL(url);
        MessageToast.show('Report downloaded');
      }).catch(function () {
        MessageToast.show('Export failed');
      });
    }

  });
});
