import React from 'react';

class FocusedTweet extends React.Component {

  render() {
    console.log(this.props.tweet);
    return (
      <div className="tweet-tooltip">
        <h1> Tweet </h1>
        <img src = {this.props.tweet.url} height = "200px"/>
        <p> {this.props.tweet.text} </p>
      </div>
    );
  }
}

export default FocusedTweet;
