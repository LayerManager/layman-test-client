import assert from 'assert';
import {Form} from 'semantic-ui-react'
import PublicationAccessRightsParams from "./PublicationAccessRightsParams";

const NO_STYLE_CHOSEN = 'no_style_chosen';
const STYLE_CHOSEN_AND_PENDING = 'style_chosen_and_pending';
const STYLE_CHOSEN_AND_ERROR = 'style_chosen_and_error';
const STYLE_CHOSEN_AND_LOADED = 'style_chosen_and_loaded';
const STYLE_STATES = [
    NO_STYLE_CHOSEN,
    STYLE_CHOSEN_AND_PENDING,
    STYLE_CHOSEN_AND_ERROR,
    STYLE_CHOSEN_AND_LOADED,
]

class PostWorkspaceLayersParams extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      style: NO_STYLE_CHOSEN,
    };
  }

  render() {
    const style_state = this.state.style;
    assert(STYLE_STATES.includes(style_state));
    let style_ui = null;
    return (
        <div>
          <Form.Field inline className="mandatory">
            <label>Data file</label>
            <input name="file" type="file" multiple/>
          </Form.Field>
          <Form.Input
              inline
              name="name"
              label='Layer name'
              placeholder='Layer name'
              value={this.props.layername}
              onChange={this.props.handleLayernameChange}/>
          <Form.Input
              inline
              name="title"
              label='Layer title'
              placeholder='Layer title'/>
          <Form.Input
              inline
              name="description" label='Layer description'
              placeholder='Layer description'/>
          <Form.Input
              inline
              name="crs"
              label='CRS'
              placeholder='CRS'/>
          <Form.Field inline>
            <label>Style file</label>
            <input name="style" type="file" accept=".sld,.xml,.qml"/>
          </Form.Field>
          {style_ui}
          <PublicationAccessRightsParams/>
        </div>
    );
  }
}

export default PostWorkspaceLayersParams;

