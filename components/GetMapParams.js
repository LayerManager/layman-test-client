import {Form} from 'semantic-ui-react'

class GetMapParams extends React.PureComponent {

  render() {
    return (
        <div>
          <Form.Input
              inline
              className="mandatory"
              name="name"
              label='Map name'
              placeholder='Map name'
              value={this.props.mapname}
              onChange={this.props.onMapnameChange}/>
        </div>
    );
  }
}

export default GetMapParams;

