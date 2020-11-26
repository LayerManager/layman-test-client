import {Form} from 'semantic-ui-react'


class PublicationAccessRightsParams extends React.PureComponent {

  render() {
    return (
        <div>
          <Form.Input
              inline
              name="access_rights.read"
              label='Read access rights'
              placeholder='Read access rights'/>
          <Form.Input
              inline
              name="access_rights.write"
              label='Write access rights'
              placeholder='Write access rights'/>
        </div>
    );
  }
}

export default PublicationAccessRightsParams;
