sap.ui.define([
  'sap/ui/core/mvc/Controller',
  'sap/ui/model/json/JSONModel',
  'sap/ui/model/Filter',
  'sap/ui/model/FilterOperator'
], function (Controller, JSONModel, Filter, FilterOperator) {
  'use strict';

  return Controller.extend('zimele.certtracker.controller.Certifications', {

    onInit: function () {
      this.getView().setModel(new JSONModel({}), 'state');
      this._searchVal = '';
      this._statusVal = '';
      this._moduleVal = '';

      this.getOwnerComponent().getRouter()
        .getRoute('Certifications')
        .attachPatternMatched(this._onRouteMatched, this);
    },

    _onRouteMatched: function () {
      this._searchVal = '';
      this._statusVal = '';
      this._moduleVal = '';
      this.byId('certSearch').setValue('');
      this.byId('statusFilter').setSelectedKey('');
      this.byId('moduleFilter').setSelectedKey('');
      this._applyFilters();
    },

    _applyFilters: function () {
      var aFilters = [];
      if (this._statusVal) {
        aFilters.push(new Filter('status', FilterOperator.EQ, this._statusVal));
      }
      if (this._moduleVal) {
        aFilters.push(new Filter('certModule', FilterOperator.EQ, this._moduleVal));
      }
      if (this._searchVal) {
        aFilters.push(new Filter({
          filters: [
            new Filter('certName', FilterOperator.Contains, this._searchVal),
            new Filter('certCode', FilterOperator.Contains, this._searchVal)
          ],
          and: false
        }));
      }
      this.byId('certTable').getBinding('items').filter(aFilters);
    },

    onSearch: function (oEvent) {
      this._searchVal = oEvent.getParameter('newValue') || '';
      this._applyFilters();
    },

    onStatusFilterChange: function (oEvent) {
      this._statusVal = oEvent.getParameter('selectedItem').getKey();
      this._applyFilters();
    },

    onModuleFilterChange: function (oEvent) {
      this._moduleVal = oEvent.getParameter('selectedItem').getKey();
      this._applyFilters();
    },

    onSelectCert: function (oEvent) {
      var oCtx = oEvent.getSource().getBindingContext();
      var empId = oCtx.getProperty('employee_ID');
      if (empId) {
        this.getOwnerComponent().getRouter().navTo('EmployeeDetail', { id: empId });
      }
    },

    onAddCertification: function () {
      this.getOwnerComponent().getRouter().navTo('AddCertification');
    },

    onNavBack: function () {
      this.getOwnerComponent().getRouter().navTo('Dashboard');
    },

    statusToState: function (sStatus) {
      switch (sStatus) {
        case 'ACTIVE':         return 'Success';
        case 'EXPIRING_SOON':  return 'Warning';
        case 'EXPIRED':        return 'Error';
        default:               return 'None';
      }
    }

  });
});
