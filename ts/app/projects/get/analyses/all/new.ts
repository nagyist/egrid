/// <reference path="../../../../../ts-definitions/DefinitelyTyped/angularjs/angular.d.ts"/>
/// <reference path="../../../../../ts-definitions/DefinitelyTyped/angular-ui/angular-ui-router.d.ts"/>
/// <reference path="../../../../../lib/egrid-client.d.ts"/>

module egrid.app {
  export class AnalysisCreateController {
    public static $inject : string[] = ['$window', '$q', '$rootScope', '$stateParams', '$state'];
    projectKey : string;
    data : model.Analysis;

    constructor($window, private $q, $rootScope, $stateParams, private $state) {
      this.projectKey = $stateParams.projectKey;

      this.data = new model.Analysis({
        projectKey: this.projectKey
      });
    }

    submit() {
      this.$q.when(this.data.save())
        .then((analysis : model.Analysis) => {
          this.$state.go('egrid.projects.get.analyses.get.detail', {analysisKey: analysis.key});
        })
        ;
    }
  }
}
