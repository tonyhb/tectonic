import React, { PropTypes } from 'react';
import css from 'react-css-modules';
import styles from './scanOverlay.css';

const ScanOverlay = ({ header, submitText, onSubmit, onCancel }) => (
  <div styleName='overlay'>
    <p>{ header }</p>
    <button styleName='cancel' onClick={ onCancel }>Cancel</button>
    <button onClick={ onSubmit }>{ submitText }</button>
  </div>
);

ScanOverlay.propTypes = {
  header: PropTypes.string.isRequired,
  submitText: PropTypes.string.isRequried,

  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
};

export default css(styles)(ScanOverlay);
