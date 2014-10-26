/// <reference path="../../../../../ts-definitions/DefinitelyTyped/angularjs/angular.d.ts"/>
/// <reference path="../../../../../ts-definitions/DefinitelyTyped/angular-ui/angular-ui-router.d.ts"/>
/// <reference path="../../../../../lib/egrid-client.d.ts"/>

module egrid.app {
  class ParticipantDetailController {
    public static $inject: string[] = [
      '$window',
      '$q',
      '$state',
      '$modal',
      'showAlert',
      'authorization',
      'participant'
    ];

    constructor(
        private $window,
        private $q,
        private $state,
        private $modal,
        private showAlert,
        private authorization,
        private participant) {
    }

    update() {
      this.$q.when(this.participant.save())
        .then((participant: egrid.model.Participant) => {
          this.participant.name = participant.name;
          this.participant.note = participant.note;
          this.showAlert('MESSAGES.UPDATED');
        }, (reason) => {
          if (reason.status === 401) {
            this.$window.location.href = this.authorization.logoutUrl;
          }

          if (reason.status === 404 || reason.status === 500) {
            this.$state.go('egrid.projects.get.participants.all.list');
            this.showAlert('MESSAGES.ITEM_NOT_FOUND', 'warning');
          }
        });
    }

    confirm() {
      this.$modal
        .open({
          templateUrl: 'partials/dialogs/remove-item.html',
          controller: ($scope, $modalInstance) => {
            $scope.ok = () => {
              $modalInstance.close();
            },
            $scope.cancel = () => {
              $modalInstance.dismiss();
            }
          }
        })
        .result
        .then(() => {
          this.$q.when(this.participant.remove())
            .then(() => {
              this.showAlert('MESSAGES.REMOVED');
              this.$state.go('egrid.projects.get.participants.all.list', null, {
                reload: true
              });
            }, (reason) => {
              if (reason.status === 401) {
                this.$window.location.href = this.authorization.logoutUrl;
              }

              if (reason.status === 404 || reason.status === 500) {
                this.$state.go('egrid.projects.get.participants.all.list');
                this.showAlert('MESSAGES.ITEM_NOT_FOUND', 'warning');
              }
            });
        });
    }
  }

  angular.module('egrid')
    .config(['$stateProvider', ($stateProvider: ng.ui.IStateProvider) => {
      $stateProvider.state('egrid.projects.get.participants.get.detail', {
        url: '/detail',
        views: {
          'tab-content@egrid.projects.get.participants.get': {
            controller: 'ParticipantDetailController as detail',
            templateUrl: 'partials/projects/get/participants/get/detail.html',
          },
        },
      });
    }])
    .controller('ParticipantDetailController', ParticipantDetailController);
}
