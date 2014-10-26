/// <reference path="../../../ts-definitions/DefinitelyTyped/angularjs/angular.d.ts"/>
/// <reference path="../../../ts-definitions/DefinitelyTyped/angular-ui/angular-ui-router.d.ts"/>
/// <reference path="../../..//lib/egrid-client.d.ts"/>

class AnalysisDetailController {
  public static $inject: string[] = [
    '$window',
    '$q',
    '$state',
    'showAlert',
    'showConfirmDialog',
    'authorization',
    'analysis'
  ];

  constructor(
      private $window,
      private $q,
      private $state,
      private showAlert,
      private showConfirmDialog,
      private authorization,
      private analysis) {
  }

  update() {
    this.$q.when(this.analysis.save())
      .then((analysis: egrid.model.Analysis) => {
        this.analysis.name = analysis.name;
        this.showAlert('MESSAGES.UPDATED');
      }, (reason) => {
        if (reason.status === 401) {
          this.$window.location.href = this.authorization.logoutUrl;
        }

        if (reason.status === 404 || reason.status === 500) {
          this.$state.go('egrid.projects.get.analyses.all.list');
          this.showAlert('MESSAGES.ITEM_NOT_FOUND', 'warning');
        }
      });
  }

  remove() {
    this.showConfirmDialog('MESSAGES.CONFIRM_REMOVE')
      .result
      .then(() => {
        this.$q.when(this.analysis.remove())
          .then(() => {
            this.showAlert('MESSAGES.REMOVED');
            this.$state.go('egrid.projects.get.analyses.all.list', null, {
              reload: true
            });
          }, (reason) => {
            if (reason.status === 401) {
              this.$window.location.href = this.authorization.logoutUrl;
            }

            if (reason.status === 404 || reason.status === 500) {
              this.$state.go('egrid.projects.get.analyses.all.list');
              this.showAlert('MESSAGES.ITEM_NOT_FOUND', 'warning');
            }
          });
      });
  }
}

angular.module('egrid')
  .config(['$stateProvider', ($stateProvider: ng.ui.IStateProvider) => {
    $stateProvider
      .state('egrid.projects.get.analyses.get.detail', {
        url: '/detail',
        views: {
          'tab-content@egrid.projects.get.analyses.get': {
            controller: 'AnalysisDetailController as detail',
            templateUrl: 'partials/projects/get/analyses/get/detail.html',
          },
        },
      });
  }])
  .controller('AnalysisDetailController', AnalysisDetailController);
