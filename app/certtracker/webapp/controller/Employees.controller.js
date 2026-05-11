sap.ui.define([
  'sap/ui/core/mvc/Controller',
  'sap/ui/model/json/JSONModel',
  'sap/ui/model/Filter',
  'sap/ui/model/FilterOperator'
], function (Controller, JSONModel, Filter, FilterOperator) {
  'use strict';

  return Controller.extend('zimele.certtracker.controller.Employees', {

    onInit: function () {
      this.getView().setModel(new JSONModel({}), 'state');
      this.getOwnerComponent().getRouter()
        .getRoute('Employees')
        .attachPatternMatched(this._onRouteMatched, this);
    },

    _onRouteMatched: function () {
      this.byId('empSearch').setValue('');
      this.byId('empTable').getBinding('items').filter([]);
    },

    onSearch: function (oEvent) {
      var sVal = oEvent.getParameter('newValue') || '';
      var aFilters = [];
      if (sVal) {
        aFilters = [new Filter({
          filters: [
            new Filter('firstName', FilterOperator.Contains, sVal),
            new Filter('lastName', FilterOperator.Contains, sVal),
            new Filter('employeeId', FilterOperator.Contains, sVal),
            new Filter('role', FilterOperator.Contains, sVal),
            new Filter('department', FilterOperator.Contains, sVal)
          ],
          and: false
        })];
      }
      this.byId('empTable').getBinding('items').filter(aFilters);
    },

    onSelectEmployee: function (oEvent) {
      var oCtx = oEvent.getSource().getBindingContext();
      var sId = oCtx.getProperty('ID');
      this.getOwnerComponent().getRouter().navTo('EmployeeDetail', { id: sId });
    },

    onAddCertification: function () {
      this.getOwnerComponent().getRouter().navTo('AddCertification');
    },

    onNavBack: function () {
      this.getOwnerComponent().getRouter().navTo('Dashboard');
    },

    // ── Formatters ─────────────────────────────────────────────────────────────

    _computeStatus: function (expiryDate) {
      if (!expiryDate) return 'ACTIVE';
      var today = new Date(); today.setHours(0, 0, 0, 0);
      var expiry = new Date(expiryDate);
      var in60 = new Date(today); in60.setDate(in60.getDate() + 60);
      if (expiry < today) return 'EXPIRED';
      if (expiry < in60) return 'EXPIRING_SOON';
      return 'ACTIVE';
    },

    countActive: function (aCerts) {
      if (!Array.isArray(aCerts)) return 0;
      return aCerts.filter(c => this._computeStatus(c.expiryDate) === 'ACTIVE').length;
    },

    countExpired: function (aCerts) {
      if (!Array.isArray(aCerts)) return 0;
      return aCerts.filter(c => this._computeStatus(c.expiryDate) === 'EXPIRED').length;
    },

    statusIcon: function (aCerts) {
      if (!Array.isArray(aCerts) || aCerts.length === 0) return 'sap-icon://status-inactive';
      var statuses = aCerts.map(c => this._computeStatus(c.expiryDate));
      if (statuses.includes('EXPIRED')) return 'sap-icon://status-negative';
      if (statuses.includes('EXPIRING_SOON')) return 'sap-icon://status-critical';
      return 'sap-icon://status-positive';
    },

    statusState: function (aCerts) {
      if (!Array.isArray(aCerts) || aCerts.length === 0) return 'None';
      var statuses = aCerts.map(c => this._computeStatus(c.expiryDate));
      if (statuses.includes('EXPIRED')) return 'Error';
      if (statuses.includes('EXPIRING_SOON')) return 'Warning';
      return 'Success';
    }

  });
});
