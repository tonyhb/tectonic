import React from 'react';
import css from 'react-css-modules';
import styles from './month.css';

const Month = ({ month }) => <p styleName='month'>{ month }</p>;

Month.propTypes = {
  month: React.PropTypes.string,
};

export default css(styles)(Month);
