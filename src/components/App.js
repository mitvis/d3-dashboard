import React from 'react';
import FilterCheckboxes from './FilterCheckboxes';
import TweetScatterplot from './TweetScatterplot';

const d3 = window.d3;

class App extends React.Component {

  constructor(props) {
    super(props);

    this.state = {
      data: null,
      communityColors: null,
      selectedCommunities: null,
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
        const k20 = Number(d[i].k20);
        communityFrequencies[k20] = communityFrequencies[k20] ? communityFrequencies[k20] + 1 : 1;
      }

      console.log(communityFrequencies);
      //

      this.setState({
        data: d,
        communityColors,
        selectedCommunities: new Set(domain.map(n => String(n)))
      });
    });
  }

  onCheckboxChange(name, checked) {
    const selection = this.state.selectedCommunities;
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

  render() {
    if (!this.state.data) return null;
    return (
      <div className="App">
        <FilterCheckboxes communityColors={this.state.communityColors} selectedCommunities={this.state.selectedCommunities} onCheckboxChange={(a, b) => this.onCheckboxChange(a, b)}></FilterCheckboxes>
        <TweetScatterplot 
          width={window.innerWidth}
          height={window.innerHeight}
          data={this.state.data} 
          communityColors={this.state.communityColors}
          selectedCommunities={this.state.selectedCommunities}></TweetScatterplot>
      </div>
    );
  }
}

export default App;
