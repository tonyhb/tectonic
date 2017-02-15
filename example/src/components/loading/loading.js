import React from 'react';
import css from 'react-css-modules';
import styles from './loading.css';

const titles = [
  'Won\'t be long!',
  'Bear with us',
  'Two secs',
  'On your marks',
  'Hold up',
  'Its a-comin...',
  '\uD83D\uDE01',
];

const getTitle = () => {
  const i = Math.floor(Math.random() * titles.length);
  return titles[i];
};

const Loading = () => (
  <div styleName='loading'>
    <div styleName='spinner' />
    <span>{ getTitle() }</span>
  </div>
);

export default css(styles)(Loading);
