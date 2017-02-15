import React from 'react';
import css from 'react-css-modules';
import styles from './blankSlate.css';

const BlankSlate = () => (
  <p>You're not monitoring any pages!</p>
);

export default css(styles)(BlankSlate);
