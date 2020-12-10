import React from 'react';
import { debounce } from 'throttle-debounce';

const d3 = window.d3;

let nbCities = 1000; // n biggest cities to draw

const visClusters = {
  'k20-2': 'line charts',
  'k20-4': 'line charts',
  'k20-13': 'area charts',
  'k20-16': 'bar charts',
  'k20-9': 'bar charts',
  'k40-3': 'pie charts',
  'k20-0': 'tables',
  'k20-7': 'tables',
  'k20-15': 'maps',
  'k20-11': 'dashboards',
  'k20-1': 'images w/people',
};

const visClusterColors = {
  'line charts': '#1b9e77',
  'area charts': '#d95f02',
  'bar charts': '#7570b3',
  'pie charts': '#e7298a',
  'tables': '#66a61e',
  'maps': '#e6ab02',
  'dashboards': '#a6761d',
  'images w/people': '#777777',
  'null': '#e1e1e1'
}

class TweetScatterplot extends React.Component {

  constructor(props) {
    super(props);

    this.state = {
      context: null,
      points: null,
      t: null
    }
  }

  componentDidMount() {
    const width = this.props.width;
    const height = this.props.height;

    this.debounceSaveState = debounce(250, (context, points, t) => {
      this.setState({
        context, points, t
      });
    })

    const tau = Math.PI * 2;
    let hover_able = [];

      // Find the nodes within the specified rectangle.
    function search(quadtree, x0, y0, x3, y3) {
      const nodes = []
      // console.log(quadtree.size());
      quadtree.visit((node, x1, y1, x2, y2) => {
        // node.data contient les points à retracer
        if (!node.length) {
          do {
            var d = node.data;
            d.scanned = true;
            d.selected = (d.x >= x0) && (d.x < x3) && (d.y >= y0) && (d.y < y3);
            if (d.selected) nodes.push(d)
          } while (node = node.next);
        }
        return x1 >= x3 || y1 >= y3 || x2 < x0 || y2 < y0;
      });
      // console.log(nodes);
      return nodes
    }

    window.draw = (context, points, t) => {
      //console.log("drawing");
      hover_able = [];
      if (this.props.selectedCommunities) {
        const selected = this.props.selectedCommunities;
        points = points.filter(p => {
          return selected.has(p.g_d5_c10)
        });
      }

      if (points.length > nbCities) {
        points = points.slice();
        d3.quickselect(   // very nice suggestion from https://observablehq.com/@fil Thanks!!
          points,
          nbCities,
          0,
          points.length - 1,
          (a, b) => b.engagement_count - a.engagement_count
        );
        points.splice(nbCities, points.length - 1)
      }

      context.globalAlpha = 0.5;
      context.fillStyle = 'black';
      const k = 1 / t.k * 3;
      for (let i = 0; i < points.length; i++) {
        const d = points[i],
          v = Math.log(d.engagement_count) * k;
        context.beginPath();

        const key = `k20-${Number(d.k20).toFixed(0)}`;
        const visCluster = visClusters[key] || 'null';

        context.fillStyle = visClusterColors[visCluster];
        let new_obj = Object.assign({}, d);
        new_obj.size = Math.sqrt(v);
        hover_able.push(new_obj);
        context.arc(
          d.x,
          d.y,
          Math.sqrt(v),
          0,
          tau
        ) // Color, size, anything can be changed.
        context.fill()
      }

    }

    const zoom = (sel) => {
      const zoomed = () => {
        // console.log("zoomed?");
        const t = d3.event.transform;

        context.save();

        context.clearRect(0, 0, width, height);

        const viewbox = [t.invert([0, 0]), t.invert([width, height])];
        // console.log(viewbox);

        context.translate(t.x, t.y);
        context.scale(t.k, t.k);
        let points = search(
                quadtree,
                viewbox[0][0],
                viewbox[0][1],
                viewbox[1][0],
                viewbox[1][1]
        );
        window.draw(context, points, t);
        this.debounceSaveState(context, points, t);

        context.restore();
      }

      // console.log("zoom");

      const context = sel.node().getContext("2d");
      const zoomBehaviour = d3.zoom().on("zoom", zoomed);
      sel.call(zoomBehaviour);
    }

    var quadtree = d3.quadtree()
        .extent([[-1, -1], [width + 1, height + 1]])
        .x(d=> d.x)
        .y(d=>d.y);

    const data = this.props.data;
    for(let i = 0; i < data.length; i++) {
      const coors = coordinate_shift(data[i].x, data[i].y);
      data[i].x = coors.x;
      data[i].y = coors.y;
    }

    function coordinate_shift(x,y) {
      return {x: x * 40 + width/2, y: y * 40 + height/2}
    }

    let self = this;
    function getMousePos(canvas, evt) {
        //console.log(self.state.t);
        var rect = canvas.getBoundingClientRect();
        return {
          x:(Math.round(evt.clientX - rect.left) - self.state.t.x)/self.state.t.k,
          y:(Math.round(evt.clientY - rect.top) - self.state.t.y)/self.state.t.k
        }
    }


    var canvas  = d3.select("#chart").append("canvas")
      .attr("id", "canvas")
      .attr("width", width)
      .attr("height", height);

    canvas = canvas.node();



    canvas.addEventListener('mousemove', evt => {
      if (this.state.t == null) {
        return; //avoid race condition
      }
      let mousePos = getMousePos(canvas,evt);
      //console.log(mousePos);
      let tweet = null;
      for(let i = 0; i < hover_able.length; i++){
        if (Math.sqrt(Math.pow(hover_able[i].x - mousePos.x,2) + Math.pow(hover_able[i].y - mousePos.y,2)) < hover_able[i].size) {
          tweet = hover_able[i];
        }
      }
      console.log("found tweet");
      this.props.onFocusChange(tweet);
    });

    var context = canvas.getContext("2d");

    quadtree.addAll(data);
    console.log("zoom");
    window.draw(context, data, d3.zoomIdentity);
    this.debounceSaveState(context, data, d3.zoomIdentity);

    d3.select(canvas).call(zoom);
  }

  isEquivalent = (a, b) => {
      // Create arrays of property names
      var aProps = Object.getOwnPropertyNames(a);
      var bProps = Object.getOwnPropertyNames(b);

      // If number of properties is different,
      // objects are not equivalent
      if (aProps.length != bProps.length) {
          return false;
      }

      for (var i = 0; i < aProps.length; i++) {
          var propName = aProps[i];

          // If values of same property are not equal,
          // objects are not equivalent
          if (a[propName] !== b[propName] && propName != "onFocusChange") {
              return false;
          }
      }

      // If we made it this far, objects
      // are considered equivalent
      return true;
  }

  componentDidUpdate(prevProps) {
    if (!this.isEquivalent(prevProps, this.props)) {
      console.log("update");
      const context = this.state.context;
      const points = this.state.points;
      const t = this.state.t;

      context.save();

      context.clearRect(0, 0, this.props.width, this.props.height);

      context.translate(t.x, t.y);
      context.scale(t.k, t.k);

      window.draw(context, points, t);

      context.restore();
    }

  }

  render() {
    return <div className="tweet-scatterplot-legend">
      <svg height={200}>
        {
          Object.keys(visClusterColors).map((cluster, i) => {
            return (
              <g key={cluster}>
                <circle cx={10} cy={20 * i + 10} r={7} fill={visClusterColors[cluster]} />
                <text x={20} y={20 * i + 15} fill={visClusterColors[cluster]}>{cluster === 'null' ? 'other' : cluster}</text>
              </g>
            )
          })
        }
      </svg>
    </div>;
  }
}

export default TweetScatterplot;
