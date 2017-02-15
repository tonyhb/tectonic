import React, { PureComponent, PropTypes } from 'react';
import css from 'react-css-modules';
import ui from 'redux-ui';
import styles from './scan.css';
import Scan from '../../../models/scan.js';
import TagList from './tagList';

@ui()
@css(styles)
export default class ScanComponent extends PureComponent {
  static propTypes = {
    scan: PropTypes.instanceOf(Scan),
    ui: PropTypes.shape({
      scanId: PropTypes.string, // from page.js parent
    }),
    updateUI: PropTypes.func,
  }

  static calculateZoom(currentWidth, width) {
    const zoom = (currentWidth / width) * 100;
    if (zoom > 100) {
      return 100;
    }
    return Math.round(zoom, 0);
  }

  state = {
    zoom: '',
  }

  /**
   * Ensure we set the zoom correctly based on the actual width of the rendered
   * image element.
   *
   * It sucks that we have to do this targeting the real DOM, but hey...
   */
  componentDidMount() {
    this.image.onload = this.getZoom;
    window.onresize = this.getZoom;
  }

  // Check to see if we're rendering a new scan; if so we need to hide the add
  // tag form so that it doesn't persist across scans.
  componentWillReceiveProps(next) {
    if (this.props.ui.scanId !== next.scanId) {
      this.props.updateUI({
        isAddTagVisible: false,
        scanId: next.scanId,
      });
      return;
    }

    this.props.updateUI({
      scanId: next.scanId,
    });
  }

  componentWillUnmount() {
    window.onresize = undefined;
  }

  getZoom = () => {
    this.setState({
      zoom: ScanComponent.calculateZoom(this.image.width, 1280),
    });
  }

  render() {
    const { zoom } = this.state;
    const { scan } = this.props;

    return (
      <div styleName='wrapper'>
        <div styleName='header'>
          <div styleName='title'>
            <h2>{ scan.getTitle() }</h2>
            <p styleName='date'>{ scan.humanDate() }</p>
            <TagList scan={ scan } />
          </div>
          <div styleName='actions'>
            <p styleName='zoom'>Zoom: { zoom }%</p>
          </div>
        </div>
        <div styleName='scan'>
          <div><img src={ scan.imageUrl() } alt='Scan' ref={ (img) => { this.image = img; } } /></div>
        </div>
      </div>
    );
  }
}

