/// <reference path="../../../typings/angularjs/angular.d.ts"/>
/// <reference path="../../../typings/d3/d3.d.ts"/>

interface WordCloudText {
  key: string;
  value: number;
}

interface IWordCloudScope extends ng.IScope {
  texts: WordCloudText[];
  callback: (data: any) => void;
}

angular.module('egrid')
  .directive('wordCloud', () => {
    return {
      replace: true,
      restrict: 'E',
      scope: {
        texts: '=',
        callback: '='
      },
      templateUrl: '/partials/directives/word-cloud.html',
      link: (scope: IWordCloudScope, element: any) => {
        var texts = scope.texts;
        var callback = scope.callback;

        var width = element.width();
        var height = element.height();
        var fill = d3.scale.category20b();
        var fontSize = d3.scale.sqrt()
          .domain(d3.extent(texts, text => text.value))
          .range([10, 100]);
        var angles = [-90, 0];

        var svg = d3.select(element[0])
          .select('svg')
          .style('width', width + 'px')
          .style('height', height + 'px');
        var contents = svg.append('g')
          .attr('transform', 'translate(' + [width / 2, height / 2] + ')');
        var cloud = (<any>d3).layout.cloud()
          .words(texts)
          .fontSize(d => fontSize(+d.value))
          .text(d => d.key)
          .font('Impact')
          .rotate(() => angles[Math.floor(Math.random() * angles.length)])
          .size([width, height])
          .on('end', function(data, bounds) {
            var scale = bounds ? Math.min(
              width / Math.abs(bounds[1].x - width / 2),
              width / Math.abs(bounds[0].x - width / 2),
              height / Math.abs(bounds[1].y - height / 2),
              height / Math.abs(bounds[0].y - height / 2)) / 2 : 1;
            var text = contents.selectAll('text')
              .data(data, (d: any) => d.text);
            text.enter()
              .append('text')
              .attr({
                'text-anchor': 'middle',
                'transform': (d) => 'translate(' + [d.x, d.y] + ')rotate(' + d.rotate + ')',
              })
              .style('font-size', d => d.size + 'px')
              .style('cursor', 'pointer')
              .on('click', (d) => {
                if (callback) {
                  callback(d.text);
                }
              })
              .on('mouseover', function() {
                d3.select(this)
                  .style('opacity', 0.5);
              })
              .on('mouseleave', function() {
                d3.select(this)
                  .style('opacity', 1);
              });
            text
              .style('font-family', (d) => d.font)
              .style('fill', (d) => fill(d.text))
              .text(d => d.text);
          })
          .start();
      }
    };
  });
