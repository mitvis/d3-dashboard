import React from 'react';

class FilterCheckboxes extends React.Component {
  onChange = e => {
    this.props.onCheckboxChange(e.target.name, e.target.checked);
  }

  createCheckboxes = (communityColors, selectedCommunities) => {
    return Object.entries(communityColors).map(([key, value]) => {
      return (<div key={key} className={'filter-checkbox'} style={{"backgroundColor": value}}>
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
        <div className={"filter-checkboxes-label"}>Communities:</div>
        {this.createCheckboxes(this.props.communityColors, this.props.selectedCommunities)}
      </div>
    );
  }
}

export default FilterCheckboxes;
