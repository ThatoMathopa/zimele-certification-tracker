sap.ui.define([
  'sap/ui/core/mvc/Controller',
  'sap/ui/model/json/JSONModel'
], function (Controller, JSONModel) {
  'use strict';

  return Controller.extend('zimele.certtracker.controller.EmployeeDetail', {

    onInit: function () {
      this.getView().setModel(new JSONModel({
        id: '', fullName: '', initials: '', role: '', department: '',
        email: '', manager: '', employeeId: '',
        certifications: [], certCount: '0',
        recommended: []
      }), 'state');

      this.getOwnerComponent().getRouter()
        .getRoute('EmployeeDetail')
        .attachPatternMatched(this._onRouteMatched, this);
    },

    _onRouteMatched: function (oEvent) {
      var sId = oEvent.getParameter('arguments').id;
      this._loadEmployee(sId);
    },

    _loadEmployee: function (sId) {
      var oModel = this.getView().getModel();
      var oState = this.getView().getModel('state');

      oModel.bindContext('/Employees(\'' + sId + '\')', null, {
        $expand: 'certifications,learningPaths'
      }).requestObject().then(function (oEmp) {
        var sInitials = ((oEmp.firstName || ' ')[0] + (oEmp.lastName || ' ')[0]).toUpperCase();
        oState.setProperty('/id', sId);
        oState.setProperty('/fullName', oEmp.firstName + ' ' + oEmp.lastName);
        oState.setProperty('/initials', sInitials);
        oState.setProperty('/role', oEmp.role || '');
        oState.setProperty('/department', oEmp.department || '');
        oState.setProperty('/email', oEmp.email || '');
        oState.setProperty('/manager', oEmp.manager || '—');
        oState.setProperty('/employeeId', oEmp.employeeId || '');

        var aCerts = (oEmp.certifications || []).map(function (c) {
          return Object.assign({}, c, { status: computeStatus(c.expiryDate) });
        });
        oState.setProperty('/certifications', aCerts);
        oState.setProperty('/certCount', String(aCerts.length));

        this._loadRecommended(oModel, oState, aCerts);
      }.bind(this)).catch(function (err) {
        console.error('Load employee failed:', err);
      });
    },

    _loadRecommended: function (oModel, oState, aCerts) {
      var heldCodes = new Set(aCerts.map(function (c) { return c.certCode; }));
      oModel.bindContext('/CertificationCatalog', null, {
        $filter: 'isActive eq true',
        $orderby: 'certModule asc'
      }).requestObject().then(function (oData) {
        var all = (oData && oData.value) ? oData.value : [];
        var recommended = all.filter(function (c) { return !heldCodes.has(c.certCode); });
        oState.setProperty('/recommended', recommended);
      }).catch(function () {
        // silently fail on recommended
      });
    },

    onAddCertification: function () {
      this.getOwnerComponent().getRouter().navTo('AddCertification');
    },

    onNavBack: function () {
      history.go(-1);
    },

    // ── Formatters ─────────────────────────────────────────────────────────────

    statusToState: function (sStatus) {
      switch (sStatus) {
        case 'ACTIVE':         return 'Success';
        case 'EXPIRING_SOON':  return 'Warning';
        case 'EXPIRED':        return 'Error';
        case 'IN_PROGRESS':    return 'Information';
        default:               return 'None';
      }
    },

    learningStatusToState: function (s) {
      switch (s) {
        case 'COMPLETED':    return 'Success';
        case 'IN_PROGRESS':  return 'Information';
        case 'NOT_STARTED':  return 'None';
        default:             return 'None';
      }
    }

  });

  function computeStatus(expiryDate) {
    if (!expiryDate) return 'ACTIVE';
    var today = new Date(); today.setHours(0, 0, 0, 0);
    var expiry = new Date(expiryDate);
    var in60 = new Date(today); in60.setDate(in60.getDate() + 60);
    if (expiry < today) return 'EXPIRED';
    if (expiry < in60) return 'EXPIRING_SOON';
    return 'ACTIVE';
  }
});
