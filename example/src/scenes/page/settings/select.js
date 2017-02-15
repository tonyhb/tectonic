import React, { PropTypes } from 'react';
import css from 'react-css-modules';
import styles from './select.css';

const Select = ({ children, mode, isSelected, onClick }) => (
  <button
    styleName={ isSelected ? `select ${mode} selected` : `select ${mode}` }
    onClick={ onClick }
  >
    { children }
  </button>
);

Select.propTypes = {
  children: PropTypes.node.isRequired,
  onClick: PropTypes.func.isRequired,
  mode: PropTypes.string.isRequired,
  isSelected: PropTypes.bool,
};

export default css(styles, { allowMultiple: true })(Select);
