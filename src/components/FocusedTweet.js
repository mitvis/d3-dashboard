import React from 'react';

class FocusedTweet extends React.Component {

  render() {
    console.log(this.props.tweet);
    return (
      <div className="tweet-tooltip">
      <p className = "engagement_count"> Engagement Count: {this.props.tweet.engagement}</p>
        <h1> Tweet </h1>
        <p> {this.props.tweet.date} </p>
        <img src = {this.props.tweet.url} height = "200px"/>
        <p> {this.props.tweet.text} </p>
        <p> {this.props.tweet.favorite} <img src = "https://upload.wikimedia.org/wikipedia/commons/d/d0/Heart_font_awesome.svg" height = "15px"/> | {this.props.tweet.retweet} <img src = "https://upload.wikimedia.org/wikipedia/commons/7/73/Retweet_font_awesome.svg" height = "15px"/>  </p>
      </div>
    );
  }
}

export default FocusedTweet;
