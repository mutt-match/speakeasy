import React, { Component } from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import io from 'socket.io-client'
import ChatLog from '../components/chatLog'
import { recentEventMessages, newEventMessage } from '../actions/eventMessagesActions'
import { createDMRoom } from '../actions/dmRoomsActions'
import { Redirect } from 'react-router-dom'
import { Link } from 'react-router-dom'
import axios from 'axios'
import Header from '../components/header'
import { Col, Grid, Row } from 'react-bootstrap'




const socket = io();

class EventChat extends Component {
  constructor(props) {
    super(props);

    this.state = {
      text: '',
      closed: false,
      dm: false,
      files: [],
      imagePreviewUrls: [],
      passwordInput: '',
      showPasswordInput: false,
      showChat: !!!this.props.event.password,
      redirectHome: false,
      isInput: true
    };

    this.handleInputChange = this.handleInputChange.bind(this)
    this.handleSendClick = this.handleSendClick.bind(this)
    this.handleKeyPress = this.handleKeyPress.bind(this)
    this.handleCloseClick = this.handleCloseClick.bind(this)
    this.handleDMClick = this.handleDMClick.bind(this)
    this._handleLogIn = this._handleLogIn.bind(this)
    this._handleLogOut = this._handleLogOut.bind(this)
    this._handleRefreshMessages = this._handleRefreshMessages.bind(this)
    this._handleRecentMessages = this._handleRecentMessages.bind(this)
    this._handleClosedEvent = this._handleClosedEvent.bind(this)
    this.handleUpload = this.handleUpload.bind(this)
    this.renderImagePreview = this.renderImagePreview.bind(this)
    this.registerImageUrl = this.registerImageUrl.bind(this)
    this.submitPasswordForm = this.submitPasswordForm.bind(this)
    this.handlePasswordChange = this.handlePasswordChange.bind(this)
    this.redirectHome = this.redirectHome.bind(this)
    this.setShowForm = this.setShowForm.bind(this)
    this.scrollToBottom = this.scrollToBottom.bind(this)
    this.renderEmptyTextMessage = this.renderEmptyTextMessage.bind(this);
  }

  componentDidMount() {
    this._handleLogIn()
    this._handleClosedEvent()
    this._handleRecentMessages()
    this._handleRefreshMessages()
    this.setShowForm()
    this.scrollToBottom()
  }

  componentDidUpdate() {
    this.scrollToBottom()
  }

  componentWillUnmount() {
    socket.removeAllListeners()
    this._handleLogOut()
  }

  scrollToBottom() {
    this.messagesEnd.scrollIntoView({ behavior: 'smooth' })
  }

  handleInputChange(e) {
    this.setState({
      text: e.target.value,
      isInput: true
    });
  }

  setShowForm() {
    if (!!this.props.event.password) {
      this.setState({ showPasswordInput: true })
    }
    if (this.props.event.userId === this.props.user_id) {
      this.setState({ showChat: true, showPasswordInput: false })
    }
  }

  handleSendClick(event) {
    event.preventDefault();
    if (this.state.text !== '') {
      if (this.state.files.length !== 0) {
        const images = {};
        const imageLink = {};
        const text = this.state.text;
        this.state.files.map((file, index) => {
          images[index] = Math.floor(Math.random() * 100000) + file.name,
            imageLink[index] = `https://s3-us-west-1.amazonaws.com/hrlaspeakeasy/${images[index]}`
        });
        axios.post('/api/event/image/upload/geturl', images)
          .then((response) => {
            response.data.map((eachFile, index) => {
              this.registerImageUrl(eachFile)
              axios.put(eachFile.url, this.state.files[index])
                .then(() => {
                  socket.emit('newmessage', {
                    event_id: this.props.event.id,
                    user_name: this.props.user_name,
                    user_id: this.props.user_id,
                    text: text
                  }, imageLink)
                })
            })
          })
          .then(() => {
            this.setState({
              text: '',
              files: [],
              imagePreviewUrls: []
            })
          })
      } else {
        socket.emit('newmessage', {
          event_id: this.props.event.id,
          user_name: this.props.user_name,
          user_id: this.props.user_id,
          text: this.state.text
        });
        this.setState({
          text: '',
          isInput: true
        });
      };
    } else {
      this.setState({
        isInput: false
      })
    }
  }

  registerImageUrl(eachFile) {
    const imageData = {
      name: eachFile.fileName,
      imageLink: `https://s3-us-west-1.amazonaws.com/hrlaspeakeasy/${eachFile.fileName}`,
      userId: this.props.user_id,
      eventId: this.props.event.id
    };
    axios.post('/api/event/image/upload', imageData)
      .then((response) => {
      })
      .catch((error) => {
        console.log('error', error);
      })
  }

  handleKeyPress(event) {
    if (event.key === 'Enter') {
      if (this.state.text !== '') {
        if (this.state.files.length !== 0) {
          const images = {};
          const imageLink = {};
          const text = this.state.text;
          this.state.files.map((file, index) => {
            images[index] = Math.floor(Math.random() * 100000) + file.name,
              imageLink[index] = `https://s3-us-west-1.amazonaws.com/hrlaspeakeasy/${images[index]}`
          });
          axios.post('/api/event/image/upload/geturl', images)
            .then((response) => {
              response.data.map((eachFile, index) => {
                this.registerImageUrl(eachFile)
                axios.put(eachFile.url, this.state.files[index])
                  .then(() => {
                    socket.emit('newmessage', {
                      event_id: this.props.event.id,
                      user_name: this.props.user_name,
                      user_id: this.props.user_id,
                      text: text
                    }, imageLink)
                  })
              })
            })
            .then(() => {
              this.setState({
                text: '',
                files: [],
                imagePreviewUrls: []
              })
            })
        } else {
          socket.emit('newmessage', {
            event_id: this.props.event.id,
            user_name: this.props.user_name,
            user_id: this.props.user_id,
            text: this.state.text
          });
          this.setState({
            isInput: false
          })
        }
      }
    }
  }

  handleCloseClick(event) {
    event.preventDefault()
    socket.emit('closeevent', { event_id: this.props.event.id });
    axios.put('/api/crosspath', { eventId: this.props.event.id })
      .then(() => {
        axios.put('/api/event/close', { event_id: this.props.event.id })
          .then(() => {
            this.setState({
              closed: true
            })
          })
      })
  }

  handleDMClick(message) {
    if (this.props.user_id !== message.user_id) {
      axios.post('/api/dmrooms/create', {
        userId: this.props.user_id,
        anotherId: message.user_id
      })
        .then((response) => {
          let dm_id = response.data.room.id;
          this.props.createDMRoom(message.user_name, dm_id)
          this.setState({ dm: true })
        })
    } else {
      return;
    }
  }

  _handleLogIn() {
    socket.connect();
    socket.emit('enterevent', {
      event_id: this.props.event.id,
      user_name: this.props.user_name
    });
  }

  _handleLogOut() {
    socket.emit('leaveevent', {
      user_name: this.props.user_name,
      event_id: this.props.event_id
    });
  }

  _handleRecentMessages() {
    socket.on('recentmessages', recentMessages => {
      this.props.recentEventMessages(recentMessages);
    });
  }

  _handleRefreshMessages() {
    socket.on('refreshmessages', newMessage => {
      this.props.newEventMessage(newMessage);
    });
  }

  _handleClosedEvent() {
    socket.on('eventclosed', () => {
      this.setState({
        closed: true
      })
    })
  }

  handleUpload(event) {
    event.preventDefault();
    const files = event.target.files;
    const stateFiles = this.state.files;
    const stateImagePreviewUrls = this.state.imagePreviewUrls;

    for (let i = 0, file; file = files[i]; i++) {
      let reader = new FileReader();
      reader.onloadend = () => {
        stateFiles.push(file);
        stateImagePreviewUrls.push(reader.result);
        this.setState({
          files: stateFiles,
          imagePreviewUrls: stateImagePreviewUrls
        });
      };
      reader.readAsDataURL(file);
    }
  }

  renderImagePreview() {
    const imagePreviewUrls = this.state.imagePreviewUrls
    return (
      <div>
        {imagePreviewUrls.map((eachUrl) => {
          return <img key={Math.random()} className="thumb" src={eachUrl} />
        })}
      </div>
    )
  }

  submitPasswordForm(event) {
    event.preventDefault();
    if (this.state.passwordInput === this.props.event.password) {
      this.setState({ showChat: true, showPasswordInput: false })
    } else {
      alert("wrong password")
    }
  }

  handlePasswordChange(event) {
    this.setState({
      passwordInput: event.target.value
    })
  }

  redirectHome() {
    this.setState({ redirectHome: true })
  }

  renderEmptyTextMessage() {
    let msg = this.state.isInput ? null : <div>please enter text</div>
    return (
      { msg }
    )
  }

  renderCloseEventButton() {
    let closeEvent;
    if (this.props.user_id === this.props.event.userId) {

      closeEvent =
        <button
          className="btnghost2"
          onClick={this.handleCloseClick}>
          <i className="fa"></i>
          Close
        </button>
    } else {
      closeEvent = null;
    }
    return closeEvent;
  }

  renderSendButton() {
    let send =
      <button
        className="btnghost2"
        onClick={this.handleSendClick}>
        Send
      </button>
    return send;
  }

  renderPasswordButton() {
    let send =
      <button
        className="btnghost2"
        type="submit"
        value="Submit">
        Submit
      </button>
    return send;
  }

  renderCancelButton() {
    return (
      <Link to="/home">
        <button type="button" className="btnghost2">Cancel</button>
      </Link>
    )
  }

  renderUploadPhoto() {
    return (
      <div className="container-fluid">
        <Grid>
          <Col>
            <input
              id="photo-upload"
              className="container"
              type="file"
              accept="image/*"
              multiple="multiple"
              onChange={(event) => this.handleUpload(event)}
            />
          </Col>
        </Grid>
      </div>
    )
  }

  renderMessage() {
    let msg;
    if (this.props.active_event) {
      msg = this.props.active_event.eventName;
    } else {
      msg = '';
    }

    return (
      <div>
        <h2>{msg}</h2>
      </div>
    );
  }

  render() {
    if (this.state.closed === true) {
      return (
        <Redirect to='/home' />
      )
    }

    if (this.state.redirectHome) {
      return (
        <Redirect to='/home' />
      )
    }

    if (this.state.dm === true) {
      return (
        <Redirect to='/dm_chat' />
      )
    }

    if (this.state.showPasswordInput) {
      return (
        <div>
          <Header
            brand="SPEAKEASY"
          />

          <section>
            <div className="container content-section text-center">
              <div className="container text-center row col-md-8 col-md-offset-2">
                <h2>Password:</h2>
                <form onSubmit={this.submitPasswordForm}>
                  <input type="text"
                    name="eventpassword"
                    value={this.state.passwordInput}
                    onChange={this.handlePasswordChange}
                  />
                  <br></br>
                  {this.renderPasswordButton()}
                  {this.renderCancelButton()}
                </form>
                <div ref={(el) => this.messagesEnd = el} />
              </div>
            </div>
          </section>
        </div>
      )
    } else {
      return (
        <div>

          <Header
            brand="SPEAKEASY"
          />

          <section>
            <div className="container content-section">
              <div className="row">
                <div className="container text-center row col-md-8 col-md-offset-2">
                  {this.renderMessage()}
                </div>
              </div>
            </div>
          </section>

          <section id="contact">
            <ChatLog
              roomMessages={this.props.messages}
              dmClick={this.handleDMClick}
            />
          </section>

          <section>
            <form onSubmit={this.handleSendClick} id="contactform" className="text-center">
              <div>
                <ul>
                  <Grid>
                    <Col>
                      <input
                        className="msg-input"
                        placeholder="Your message here *"
                        type="text"
                        onChange={this.handleInputChange}
                        value={this.state.text}
                      />
                      <div className="chat-buttons">
                        {this.renderSendButton()}
                        {this.renderCloseEventButton()}
                      </div>
                    </Col>
                  </Grid>
                </ul>
              </div>
            </form>


          {this.renderUploadPhoto()}
          </section>
          
          <div ref={(el) => this.messagesEnd = el} />

        </div >
      )
    }
  }
}

function mapStateToProps(state) {
  return {
    event: state.active_event,
    user_name: state.profile.name,
    user_id: state.profile.id,
    messages: state.event_messages
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({
    recentEventMessages: recentEventMessages,
    newEventMessage: newEventMessage,
    createDMRoom: createDMRoom
  }, dispatch)
}

export default connect(mapStateToProps, mapDispatchToProps)(EventChat);