import React from 'react';
import CH from 'color-hash';
import css from 'react-css-modules';
import styles from './tag.css';
import textColor from '../../util/color';

const Tag = ({ tag, deletable = false, onDelete }) => {
  const bg = new CH().hex(tag);
  const style = {
    backgroundColor: bg,
    color: textColor(bg),
  };

  if (deletable) {
    return (
      <button
        styleName='tag deletable'
        style={ style }
        onClick={ onDelete }
      >{ tag }</button>
    );
  }
  return <span styleName='tag' style={ style }>{ tag }</span>;
};

Tag.propTypes = {
  tag: React.PropTypes.string,
  deletable: React.PropTypes.bool,
  onDelete: React.PropTypes.func,
};

export default css(styles, { allowMultiple: true })(Tag);
