/// <reference path="../../../../../ts-definitions/DefinitelyTyped/angularjs/angular.d.ts"/>
/// <reference path="../../../../../ts-definitions/DefinitelyTyped/angular-ui/angular-ui-router.d.ts"/>
/// <reference path="../../../../../ts-definitions/DefinitelyTyped/jquery/jquery.d.ts"/>
/// <reference path="../../../../../ts-definitions/DefinitelyTyped/d3/d3.d.ts"/>
/// <reference path="../../../../../lib/d3-downloadable.d.ts"/>
/// <reference path="../../../../../lib/egrid-client.d.ts"/>
/// <reference path="../../../../../lib/egrid-core.d.ts"/>

declare var Encoding: any;

module egrid.app {
  export class ProjectGridController {
    public static $inject : string[] = ['$window', '$state', 'project', 'grid'];
    public static resolve = {
      grid: ['$q', '$stateParams', ($q: ng.IQService, $stateParams: ng.ui.IStateParamsService) => {
        return $q.when(model.ProjectGrid.get($stateParams['projectKey'], $stateParams['analysisKey']));
      }]
    };
    grid: any;
    vertices: number[];
    respondentsKey: (u: number) => number;
    degreeKey: (u: number) => number;

    constructor(
        $window,
        $state,
        private project,
        grid) {

      this.grid = egrid.core.grid(grid.nodes, grid.links);
      var width = $('#display-wrapper').width();
      var height = 500;
      var egm = egrid.core.egm()
        .maxTextLength(10)
        .enableZoom(false)
        .size([width, height]);
      var downloadable = d3.downloadable({
        filename: this.project.name,
        width: width,
        height: height
      });

      var selection = d3.select('#display')
        .datum(this.grid.graph())
        .call(egm)
        .call(egm.center())
        .call(downloadable);

      this.vertices = this.grid.graph().vertices();

      this.respondentsKey = (u) => {
        return this.grid.graph().get(u).participants.length;
      };

      this.degreeKey = (u) => {
        var graph = this.grid.graph();
        return graph.inDegree(u) + graph.outDegree(u);
      };

      $window.onresize = function() {
        var width = $('#display-wrapper').width();
        var height = 500;
        downloadable
          .width(width)
          .height(height);
        selection.call(egm.resize(width, height));
      };
    }

    numConstructs(): number {
      return this.grid.graph().numVertices();
    }

    numLinks(): number {
      return this.grid.graph().numEdges();
    }

    exportJSON($event) {
      var graph = this.grid.graph();
      var obj = {
        nodes: graph.vertices().map((u) => {
          return graph.get(u);
        }),
        links: graph.edges().map((edge) => {
          return {
            source: edge[0],
            target: edge[1],
          };
        }),
      };
      $($event.currentTarget).attr({
        href: "data:application/json;charset=utf-8," + encodeURIComponent(JSON.stringify(obj)),
        download: this.project.name + '.json',
      });
    }

    exportCSV($event) {
      var graph = this.grid.graph();
      var csvRows = ['上位項目,下位項目'];
      graph.edges().forEach((edge) => {
        var u = edge[0],
          v = edge[1];
        csvRows.push(graph.get(u).text + ',' + graph.get(v).text);
      });
      var utf8Array = Encoding.stringToCode(csvRows.join('\r\n'));
      var sjisArray = Encoding.convert(utf8Array, 'SJIS', 'UNICODE');
      $($event.currentTarget).attr({
        href: "data:text/comma-separated-values;charset=sjis," + Encoding.urlEncode(sjisArray),
        download: this.project.name + '.csv',
      });
    }
  }
}
