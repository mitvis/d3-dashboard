import React from 'react';

class FilterCheckboxes extends React.Component {
  onChange = e => {
    this.props.onCheckboxChange(e.target.name, e.target.checked);
  }

  createCheckboxes = (communityColors, selectedCommunities) => {
    return Object.entries(communityColors).map(([key, value]) => {
      return (<div key={key} style={{"backgroundColor": value, "padding": 5, "display": "inline-block"}}>
        <label htmlFor={key}>{key}</label>
        <input
          type="checkbox"
          name={key}
          defaultChecked={selectedCommunities.has(key)}
          onChange={this.onChange}
        />
      </div>);
    });
  }

  render() {
    return (
      <div className="filter-checkboxes">
        {this.createCheckboxes(this.props.communityColors, this.props.selectedCommunities)}
      </div>
    );
  }
}

export default FilterCheckboxes;
