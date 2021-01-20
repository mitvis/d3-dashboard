import React from 'react';
import { debounce } from 'throttle-debounce';

const d3 = window.d3;

let nbCities = 7000; // n biggest cities to draw

class NetworkGraph extends React.Component {

  constructor(props) {
    super(props);

    this.state = {
      context: null,
      points: null,
      edges: null,
      canvas: null,
      t: null,
      zoomBehaviour:null,
      nodeCenters: null
    }
  }

  componentDidMount() {
    const width = this.props.width;
    const height = this.props.height;

    this.debounceSaveState = debounce(250, (context, points, t) => {

      if(this.state.nodeCenters == null) {

        let nodeCenters = {};
        console.log(nodeCenters);

        for(let i = 0; i < points.length; i++) {
          let d = points[i];
          if(d.color in nodeCenters) {
            nodeCenters[d.color].x += d.x;
            nodeCenters[d.color].y += d.y;
            nodeCenters[d.color].count += 1;
          } else {
            nodeCenters[d.color] = {x: d.x, y:d.y, count: 1};
          }
        }

        for (const [key, value] of Object.entries(nodeCenters)) {
          nodeCenters[key].x = value.x/value.count;
          nodeCenters[key].y = value.y/value.count;
        }
        this.setState({nodeCenters:nodeCenters});

      }



      this.setState({
        context, points, t, canvas
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



    window.drawNetwork = (context, points, edges, t) => {
      //console.log("drawing");

      if (points.length > nbCities) {
        points = points.slice();
        d3.quickselect(   // very nice suggestion from https://observablehq.com/@fil Thanks!!
          points,
          nbCities,
          0,
          points.length - 1,
          (a, b) => b.r - a.r
        );
        points.splice(nbCities, points.length - 1)
      }

      context.globalAlpha = 0.5;
      context.fillStyle = 'black';

      const k = 1 / t.k;
      for (let i = 0; i < points.length; i++) {

        const d = points[i],
          v = d.r * k;
        context.beginPath();

        context.fillStyle = d.color;

        context.arc(
          d.x,
          d.y,
          Math.sqrt(v),
          0,
          tau
        ) // Color, size, anything can be changed.
        context.fill();
      }


      for (let i = 0; i < edges.length; i+= 5) {
        context.lineWidth = k * .5;
        context.strokeStyle = edges[i].color;
        context.beginPath();
        context.moveTo(edges[i].mx, edges[i].my);
        //context.lineTo(edges[i].c3x, edges[i].c3y);
        context.bezierCurveTo(edges[i].c1x, edges[i].c1y, edges[i].c2x, edges[i].c2y, edges[i].c3x, edges[i].c3y);
        context.stroke();
      }

      for (let i = 0; i < points.length; i++) {
        const d = points[i];
        context.textAlign = "center";
        if (d.r * t.k > 80) {
          context.font = "bold " + 20 * k + "px Arial";
          context.fillStyle = "white";
          context.fillText(d.name,parseFloat(d.x),parseFloat(d.y));
        }
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
        //console.log(t.x, t.y, t.k);
        context.translate(t.x, t.y);
        context.scale(t.k, t.k);
        let points = search(
                quadtree,
                viewbox[0][0],
                viewbox[0][1],
                viewbox[1][0],
                viewbox[1][1]
        );
        window.drawNetwork(context, points, edges, t);
        this.debounceSaveState(context, points, edges, t);

        context.restore();
      }

      // console.log("zoom");

      const context = sel.node().getContext("2d");
      const zoomBehaviour = d3.zoom().on("zoom", zoomed);
      this.setState({zoomBehaviour: zoomBehaviour});
      sel.call(zoomBehaviour);
    }

    var quadtree = d3.quadtree()
        .extent([[-1, -1], [width + 1, height + 1]])
        .x(d=> d.x)
        .y(d=>d.y);

    const data = this.props.data;
    const edges = this.props.edges;

    for(let i = 0; i < data.length; i++) {
      const coors = coordinate_shift(data[i].x, data[i].y);
      data[i].x = coors.x;
      data[i].y = coors.y;
    }

    for(let i = 0; i < edges.length; i++) {
      let m = coordinate_shift(edges[i].mx, edges[i].my);
      edges[i].mx = m.x;
      edges[i].my = m.y;
      let c1 = coordinate_shift(edges[i].c1x, edges[i].c1y);
      edges[i].c1x = c1.x;
      edges[i].c1y = c1.y;
      let c2 = coordinate_shift(edges[i].c2x, edges[i].c2y);
      edges[i].c2x = c2.x;
      edges[i].c2y = c2.y;
      let c3 = coordinate_shift(edges[i].c3x, edges[i].c3y);
      edges[i].c3x = c3.x;
      edges[i].c3y = c3.y;
    }

    function coordinate_shift(x,y) {
      return {x: x/ 40 + width/2, y: y/40 + height/2}
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
      .attr("id", "networkCanvas")
      .attr("width", width)
      .attr("height", height);

    canvas = canvas.node();

    var context = canvas.getContext("2d");

    quadtree.addAll(data);
    console.log("zoom");
    window.drawNetwork(context, data, edges, d3.zoomIdentity);
    this.debounceSaveState(context, data, edges, d3.zoomIdentity);

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

  zoomCommunity = (community) => {
      let communityToColor = {1:"#4e79a7", 12: "#9c755f",2: "#59a14f" ,6:"#76b7b2",13:"#af7aa1",15:"#bab0ab", 4:"#e15759",7:"#edc949",0:"#f28e2c",5:"#ff9da7"};
      console.log(community);
      community = communityToColor[community];

      console.log(community);

      d3.select(this.state.canvas).transition().duration(2500).call(
       this.state.zoomBehaviour.transform,
       d3.zoomIdentity.translate(this.props.width / 2, this.props.height / 2)
       .scale(3)
       .translate(-this.state.nodeCenters[community].x, -this.state.nodeCenters[community].y)
     );


     /*let d = this.props.data[Math.floor(Math.random() * this.props.data.length)];
     console.log(d);
       d3.select(this.state.canvas).transition().duration(2500).call(
        this.state.zoomBehaviour.transform,
        d3.zoomIdentity.translate(this.props.width / 2, this.props.height / 2).scale(40).translate(-d.x, -d.y)
      );*/
    }



  componentDidUpdate(prevProps) {
    if (!this.isEquivalent(prevProps, this.props)) {
      console.log(prevProps);
      console.log(this.props.selectedCommunities);

      if(this.props.selectedCommunities.size == 1){
        console.log("zooming");
        this.zoomCommunity(parseInt(this.props.selectedCommunities.values().next().value));
      }

    }

  }

  render() {
    return <> </>;
  }
}

export default NetworkGraph;
