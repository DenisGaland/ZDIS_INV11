sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/m/MessageToast",
	"sap/m/MessageBox",
	"sap/ui/model/json/JSONModel",
	"sap/ui/model/resource/ResourceModel",
	"sap/ui/model/odata/ODataModel",
	"sap/ui/core/BusyIndicator"
], function(Controller, MessageToast, MessageBox, JSONModel, ResourceModel, ODataModel, BusyIndicator) {
	"use strict";

	return Controller.extend("Press_Shop_Fiori2.controller.Master", {

		oitemSet: null,

		//Init flux
		onInit: function() {
			debugger;
			var oView = this.getView();
			var i18nModel = new ResourceModel({
				bundleName: "Press_Shop_Fiori2.i18n.i18n" //,
			});
			oView.setModel(i18nModel, "i18n");
			var oController = oView.getController();
			var osite = oView.byId("__PLANT");
			var URL = "/sap/opu/odata/sap/ZGET_PLANT_SRV/";
			var OData = new ODataModel(URL, true);
			var query = "/S_T001WSet(Type='03')";
			debugger;
			BusyIndicator.show();
			OData.read(query, null, null, true, function(response) {
				BusyIndicator.hide();
				var Open = response.Open;
				var type = response.Type;
				var plant = response.EPlant;
				var name1 = response.ET001w.Name1;
				var site = plant + " " + name1;
				osite.setText(site);
				var TypeCode = oView.byId("TYPECODE");
				TypeCode.setText(type);
				var oArticle_input = oView.byId("SearchArt");
				jQuery.sap.delayedCall(500, this, function() {
					oArticle_input.focus();
				});
				if (Open === "X") {
					oController.GetData();
				}
			}, function(error) {
				BusyIndicator.hide();
				MessageBox.error(JSON.parse(error.response.body).error.message.value, {
					title: "Error"
				});
			});
		},

		ClearBox: function() {
			var oView = this.getView();
			var URL = "/sap/opu/odata/sap/ZPREPARE_FLUX_SRV/ItemsSet(Zfilter='T" + "03" + "')";
			debugger;
			BusyIndicator.show();
			OData.read(URL, function(response) {
				BusyIndicator.hide();
				if (response.Message !== "" && response.EZtype === "O") {
					oView.byId("TOOL_BAR").setVisible(false);
					oView.byId("table1").setVisible(false);
					var model = new JSONModel();
					oView.setModel(model, "itemModel");
					MessageBox.show(response.Message, {
						icon: MessageBox.Icon.INFORMATION,
						actions: [MessageBox.Action.OK],
						onClose: function(oAction) {
							if (oAction === "OK") {
								var oArticle_input = oView.byId("Article");
								jQuery.sap.delayedCall(500, this, function() {
									oArticle_input.focus();
								});
							}
						}
					});
				}
			}, function(error) {
				BusyIndicator.hide();
				MessageBox.error(JSON.parse(error.response.body).error.message.value, {
					title: "Error"
				});
			});
		},

		searchArt: function() {
			var oView = this.getView();
			var oArticle_input = oView.byId("SearchArt");
			var oController = oView.getController();
			var material = oView.byId("SearchArt").getValue();
			var URL2 = "/sap/opu/odata/sap/ZCHECK_VALUE_SCAN_SRV/MessageSet(PValue='06" + material + "')";
			debugger;
			BusyIndicator.show();
			OData.read(URL2, function(response2) {
				BusyIndicator.hide();
				if (response2.EMessage !== "" && response2.EZtype === "E") {
					var path = $.sap.getModulePath("Press_Shop_Fiori2", "/audio");
					var aud = new Audio(path + "/MOREINFO.png");
					aud.play();
					oView.byId("SearchArt").setValue("");
					MessageBox.show(response2.EMessage, {
						icon: MessageBox.Icon.INFORMATION,
						onClose: function() {
							jQuery.sap.delayedCall(500, this, function() {
								oArticle_input.focus();
							});
						}
					});
				} else {
					var oTable = oView.byId("table1");
					oTable.setVisible(true);
					oController.GetData(material);
				}
			}, function(error) {
				BusyIndicator.hide();
				MessageBox.error(JSON.parse(error.response.body).error.message.value, {
					title: "Error"
				});
			});
		},

		GetData: function(material, from) {
			var oView = this.getView();
			var oTable = oView.byId("table1");
			var searchString = null;
			var URL = null;
			oTable.setVisible(true);
			oView.byId("TOOL_BAR").setVisible(true);
			if (from == null) {
				searchString = "A" + material + "/" + "03";
				URL = "/sap/opu/odata/sap/ZPREPARE_FLUX_SRV/ItemsSet?$filter=Zfilter " + "%20eq%20" + "%27" + searchString + "%27&$format=json";
			} else {
				searchString = "M" + "/" + material + "/" + "03" + "/" + from;
				URL = "/sap/opu/odata/sap/ZPREPARE_FLUX_SRV/ItemsSet?$filter=Zfilter " + "%20eq%20" + "%27" + searchString + "%27&$format=json";
			}
			material = oView.byId("SearchArt").setValue("");
			debugger;
			BusyIndicator.show();
			OData.read(URL, function(response) {
				BusyIndicator.hide();
				if (from != null) {
					var infoMsg = oView.getModel("i18n").getResourceBundle().getText("qty_modified");
					MessageToast.show(infoMsg, {
						my: "center top",
						at: "center top"
					});
				}
				var newArray = response.results;
				var lines = newArray.length;
				var sum = parseInt(response.results[0].Menge);
				for (var i = 1; i < response.results.length; i++) {
					if (i < response.results.length) {
						sum = parseInt(response.results[i].Menge) + sum;
					}
				}
				var model2 = new JSONModel({
					"Sum": sum,
					"Products": lines
				});
				oView.setModel(model2, "Model2");
				var model = new JSONModel({
					"items": newArray
				});
				model.setSizeLimit(2000);
				oView.setModel(model, "itemModel");
			}, function(error) {
				BusyIndicator.hide();
				MessageBox.error(JSON.parse(error.response.body).error.message.value, {
					title: "Error"
				});
			});
		},

		Validate: function() {
			var oView = this.getView();
			var oController = oView.getController();
			var ocon = oView.byId("CONFIRM").getText();
			var oyes = oView.byId("YES").getText();
			var ono = oView.byId("NO").getText();
			MessageBox.show(
				ocon, {
					actions: [oyes, ono],
					onClose: function(oAction) {
						if (oAction === oyes) {
							oController.SaveData();
						}
					}
				});
		},

		SaveData: function() {
			var oView = this.getView();
			var URL = "/sap/opu/odata/sap/ZPREPARE_FLUX_SRV/ItemsSet(Zfilter='C03')";
			var oArticle_input = oView.byId("SearchArt");
			debugger;
			BusyIndicator.show();
			OData.read(URL, function(response) {
				BusyIndicator.hide();
				if (response.Message !== "" && response.EZtype === "O") {
					oView.byId("TOOL_BAR").setVisible(false);
					oView.byId("table1").setVisible(false);
					var model = new JSONModel();
					oView.setModel(model, "itemModel");
					MessageBox.show(response.Message, {
						icon: MessageBox.Icon.INFORMATION,
						actions: [MessageBox.Action.OK],
						onClose: function(oAction) {
							if (oAction === "OK") {
								jQuery.sap.delayedCall(500, this, function() {
									oArticle_input.focus();
								});
							}
						}
					});
				} else {
					var path = $.sap.getModulePath("Press_Shop_Fiori2", "/audio");
					var aud = new Audio(path + "/MOREINFO.png");
					aud.play();
					MessageBox.show(response.Message, {
						icon: MessageBox.Icon.ERROR,
						actions: [MessageBox.Action.OK],
						onClose: function(oAction) {
							if (oAction === "OK") {
								jQuery.sap.delayedCall(500, this, function() {
									oArticle_input.focus();
								});
							}
						}
					});
				}
			}, function(error) {
				BusyIndicator.hide();
				MessageBox.error(JSON.parse(error.response.body).error.message.value, {
					title: "Error"
				});
			});
		},

		update: function(evt) {
			var oView = this.getView();
			var oArticle_input = oView.byId("SearchArt");
			var id = evt.mParameters.id;
			var number = evt.mParameters.selectedItem.getText();
			id = id.replace("oSelect", "gtin");
			var gtin = oView.byId(id).getText();
			if (!isNaN(number) && number > 0) {
				this.GetData(gtin, number);
				jQuery.sap.delayedCall(500, this, function() {
					oArticle_input.focus();
				});
			} else {
				var path = $.sap.getModulePath("Press_Shop_Fiori2", "/audio");
				var aud = new Audio(path + "/MOREINFO.png");
				aud.play();
				var infoMsg = oView.getModel("i18n").getResourceBundle().getText("numerical");
				MessageBox.show(infoMsg, {
					icon: MessageBox.Icon.ERROR,
					onClose: function() {
						jQuery.sap.delayedCall(500, this, function() {
							oArticle_input.focus();
						});
					}
				});
			}
		}
	});
});