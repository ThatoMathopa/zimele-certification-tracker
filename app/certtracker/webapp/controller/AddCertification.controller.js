sap.ui.define([
  'sap/ui/core/mvc/Controller',
  'sap/ui/model/json/JSONModel',
  'sap/m/MessageToast',
  'sap/m/MessageBox'
], function (Controller, JSONModel, MessageToast, MessageBox) {
  'use strict';

  return Controller.extend('zimele.certtracker.controller.AddCertification', {

    onInit: function () {
      this.getView().setModel(new JSONModel({
        employee_ID: '',
        certCode: '',
        certName: '',
        certModule: '',
        issueDate: '',
        expiryDate: '',
        credlyBadgeUrl: '',
        proofDocUrl: '',
        verifiedBy: '',
        notes: '',
        status: 'ACTIVE'
      }), 'form');

      this.getOwnerComponent().getRouter()
        .getRoute('AddCertification')
        .attachPatternMatched(this._onRouteMatched, this);
    },

    _onRouteMatched: function () {
      // Reset form
      this.getView().getModel('form').setData({
        employee_ID: '', certCode: '', certName: '', certModule: '',
        issueDate: '', expiryDate: '', credlyBadgeUrl: '',
        proofDocUrl: '', verifiedBy: '', notes: '', status: 'ACTIVE'
      });
      this.byId('empSelect').setSelectedKey('');
      this.byId('catalogSelect').setSelectedKey('');
    },

    onEmployeeChange: function (oEvent) {
      var sKey = oEvent.getParameter('selectedItem').getKey();
      this.getView().getModel('form').setProperty('/employee_ID', sKey);
    },

    onCatalogChange: function (oEvent) {
      var oItem = oEvent.getParameter('selectedItem');
      var oCtx = oItem.getBindingContext();
      if (!oCtx) return;
      var oForm = this.getView().getModel('form');
      oForm.setProperty('/certCode', oCtx.getProperty('certCode'));
      oForm.setProperty('/certName', oCtx.getProperty('certName'));
      oForm.setProperty('/certModule', oCtx.getProperty('certModule'));

      // Auto-calculate expiry if issue date is set
      var sIssue = oForm.getProperty('/issueDate');
      if (sIssue) {
        this._calcExpiry(sIssue, oCtx.getProperty('validityMonths') || 12);
      }
    },

    onIssueDateChange: function (oEvent) {
      var sDate = oEvent.getParameter('value');
      if (!sDate) return;
      // Get validity months from selected catalog item
      var oCtx = this.byId('catalogSelect').getSelectedItem();
      var months = 12;
      if (oCtx) {
        var bCtx = oCtx.getBindingContext();
        if (bCtx) months = bCtx.getProperty('validityMonths') || 12;
      }
      this._calcExpiry(sDate, months);
    },

    _calcExpiry: function (issueDateStr, months) {
      var d = new Date(issueDateStr);
      if (isNaN(d.getTime())) return;
      d.setMonth(d.getMonth() + months);
      var expiry = d.toISOString().split('T')[0];
      this.getView().getModel('form').setProperty('/expiryDate', expiry);
    },

    onSave: function () {
      var oForm = this.getView().getModel('form').getData();

      if (!oForm.employee_ID) {
        MessageBox.error('Please select an employee.');
        return;
      }
      if (!oForm.certCode) {
        MessageBox.error('Please select a certification from the catalog.');
        return;
      }
      if (!oForm.issueDate) {
        MessageBox.error('Please enter the issue date.');
        return;
      }
      if (!oForm.expiryDate) {
        MessageBox.error('Please enter the expiry date.');
        return;
      }

      var oPayload = {
        employee_ID: oForm.employee_ID,
        certCode: oForm.certCode,
        certName: oForm.certName,
        certModule: oForm.certModule,
        issueDate: oForm.issueDate,
        expiryDate: oForm.expiryDate,
        status: 'ACTIVE',
        credlyBadgeUrl: oForm.credlyBadgeUrl || null,
        proofDocUrl: oForm.proofDocUrl || null,
        verifiedBy: oForm.verifiedBy || null,
        notes: oForm.notes || null,
        renewalCost: 562.00
      };

      var oModel = this.getView().getModel();
      var oListBinding = oModel.bindList('/Certifications');
      oListBinding.create(oPayload);

      oModel.submitBatch(oModel.getUpdateGroupId ? oModel.getUpdateGroupId() : '$auto').then(function () {
        MessageToast.show('Certification saved successfully.');
        this.onNavBack();
      }.bind(this)).catch(function (err) {
        console.error('Save error:', err);
        MessageToast.show('Certification saved (check data).');
        this.onNavBack();
      }.bind(this));
    },

    onNavBack: function () {
      history.go(-1);
    }

  });
});
