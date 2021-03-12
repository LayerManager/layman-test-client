import {Form} from 'semantic-ui-react'

class GetPublicationsParams extends React.PureComponent {

  render() {
    return (
        <div>
          <Form.Input
              inline
              name="full_text_filter" label='Full-text filter'
              placeholder='Full-text filter'/>
        </div>
    );
  }
}

export default GetPublicationsParams;

