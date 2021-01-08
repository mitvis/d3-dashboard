import React from 'react';
import FilterCheckboxes from './FilterCheckboxes';
import TweetScatterplot from './TweetScatterplot';
import FocusedTweet from './FocusedTweet';
import NetworkGraph from './NetworkGraph';


const d3 = window.d3;

class App extends React.Component {

  constructor(props) {
    super(props);

    this.state = {
      data: null,
      communityColors: null,
      selectedCommunities: null,
      focusedTweet: null,
      nodes: null,
      edges: null
    };
  }

  componentDidMount() {
    d3.csv("https://raw.githubusercontent.com/AnnaAD/d3-dashboard/master/tweet_data.csv").then((d) => {
      const communityColors = {};

      const domain = [1, 4, 0, 6, 2, 7, 13, 5, 12, 15, -1];
      const range = ['#4e79a7','#e15759', '#f28e2c','#76b7b2','#59a14f','#edc949','#af7aa1','#ff9da7','#9c755f','#bab0ab', '#eeeeee'];

      for (let i = 0; i < domain.length; i++) {
        communityColors[domain[i]] = range[i];
      }

      //
      const communityFrequencies = {};

      for(let i = 0; i < d.length; i++) {
        let community = d[i].g_d5_c10;
        if (!d[i].g_d5_c10 && d[i].g_d5_c10 !== 0) {
          community = -1;
        }
        community = Number(community).toFixed(0);
        d[i].g_d5_c10 = community
        communityFrequencies[community] = communityFrequencies[community] ? communityFrequencies[community] + 1 : 1;
      }

      console.log(communityFrequencies);
      //

      this.setState({
        data: d,
        communityColors,
        selectedCommunities: new Set(domain.map(n => String(n)))
      });
    });

    d3.csv("https://raw.githubusercontent.com/AnnaAD/d3NetworkGraph/main/network-graph-test/nodes.csv").then((d) => {
      d3.csv("https://raw.githubusercontent.com/AnnaAD/d3NetworkGraph/main/network-graph-test/edges.csv").then((e) => {
        console.log(e);
        this.setState({
          edges: e,
          nodes: d
        });
    });
  });
  }

  onCheckboxChange(name, checked) {
    const selection = new Set(this.state.selectedCommunities);
    console.log(selection);
    if (checked) {
      selection.add(name);
    }
    else {
      selection.delete(name);
    }
    this.setState({
      selectedCommunities: selection
    })
  }

  onFocusChange(tweet) {
    //console.log(tweet);
    if (tweet == null) {
      this.setState({
        focusedTweet: null
      })
    } else {
      //console.log(tweet.full_text);
      this.setState({
        focusedTweet: {url: tweet.url, text: tweet.full_text, retweet: tweet.retweet_count, favorite: tweet.favorite_count, date: tweet.created_at, engagement: tweet.engagement_count}
      })
    }
  }

  render() {
    if (!this.state.data) return null;
    return (
      <div className="App">
        {this.state.focusedTweet != null &&
          <FocusedTweet tweet = {this.state.focusedTweet}> </FocusedTweet>
        }
        <FilterCheckboxes communityColors={this.state.communityColors} selectedCommunities={this.state.selectedCommunities} onCheckboxChange={(a, b) => this.onCheckboxChange(a, b)}></FilterCheckboxes>
        <TweetScatterplot
          width={window.innerWidth / 2}
          height={window.innerHeight}
          data={this.state.data}
          communityColors={this.state.communityColors}
          selectedCommunities={this.state.selectedCommunities}
          onFocusChange = {(a) => this.onFocusChange(a)}></TweetScatterplot>
          <NetworkGraph
            width={window.innerWidth / 2}
            height={window.innerHeight}
            data={this.state.nodes}
            edges = {this.state.edges}
            communityColors={this.state.communityColors}
            selectedCommunities={this.state.selectedCommunities}
            onFocusChange = {(a) => this.onFocusChange(a)}></NetworkGraph>
      </div>
    );
  }
}

export default App;
