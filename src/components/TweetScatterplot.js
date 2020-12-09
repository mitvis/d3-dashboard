import React from 'react';
import { debounce } from 'throttle-debounce';

const d3 = window.d3;

let nbCities = 1000; // n biggest cities to draw

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

      if (points.length > nbCities) {
        if (this.props.selectedCommunities) {
          const communities = Object.keys(this.props.communityColors);
          const selected = this.props.selectedCommunities;
          points = points.filter(p => {
            const key = p.k20;
            return communities.includes(key) ? selected.has(key) : selected.has('-1');
          });
        }
        else {
          points = points.slice();
        }
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

        context.fillStyle = this.props.communityColors[Number(d.k20)] || '#eeeeee';;

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
        const points = search(
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

    var canvas  = d3.select("#chart").append("canvas")
      .attr("id", "canvas")
      .attr("width", width)
      .attr("height", height);

    canvas = canvas.node();

    var context = canvas.getContext("2d");

    quadtree.addAll(data);
    window.draw(context, data, d3.zoomIdentity);

    d3.select(canvas).call(zoom);
  }

  componentDidUpdate() {
    const context = this.state.context;
    const points = this.state.points;
    const t = this.state.t;
    // window.draw(this.state.context, this.state.points, this.state.t);

    context.save();

    context.clearRect(0, 0, this.props.width, this.props.height);

    context.translate(t.x, t.y);
    context.scale(t.k, t.k);
    
    window.draw(context, points, t);

    context.restore();
    
  }

  render() {
    return <div></div>;
  }
}

export default TweetScatterplot;