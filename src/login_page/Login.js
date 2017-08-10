import React, { Component } from 'react';
import RegisterView from './RegisterView';

class Login extends Component {
    state = {
        username: '',
        password: '',
        showRegisterView: false
    }

    showRegisterView = () => {
        window.alert('注册请联系 web@codvision.com');
        // this.setState({showRegisterView: true});
    }

    closeRegisterView = () => {
        this.setState({showRegisterView: false});
    }

    handleUsername = (e) => {
        this.setState({username: e.target.value});
    }

    handlePassword = (e) => {
        this.setState({password: e.target.value});
    }

    loginVerify = () => {
        const that = this;
        const verifyRequest = new XMLHttpRequest();
        verifyRequest.open('POST', `${this.props.defaultURL}userlogin`);
        const data = `{"name": "${this.state.username}", "passwd": "${this.state.password}"}`;
        verifyRequest.send(data);
        verifyRequest.onload = () => {
            console.log(verifyRequest.response);
            if(verifyRequest.response === 'OK') {
                this.props.onLogin(that.state.username);
            } else {
                window.alert('用户名或密码错误');
            }
        }
    }

    handleKeyPress = (e) => {
        if(e.key === 'Enter') {
            this.loginVerify();
        }
    }

    render() {
        return (
            <div className="full-height et-background-white">
                {
                    this.state.showRegisterView ? <RegisterView defaultURL={this.props.defaultURL} onCloseRegisterView={this.closeRegisterView}/> : null
                }
                <div className="w3-orange full-width flex-box w3-text-white w3-container" style={{position: 'fixed', top: '0px', height: '8%', alignItems: 'center'}}>
                    <i className="fa fa-ravelry w3-xxlarge" aria-hidden="true"></i>
                    <h2>&nbsp;&nbsp;图像智能分析系统</h2>
                </div>
                <div className="flex-box full-height" style={{justifyContent: 'center', alignItems: 'center'}}>
                    <div onKeyPress={this.handleKeyPress} className="flex-box flex-column" style={{width: '20%'}}>
                        <h3 className="w3-center w3-text-black"><b>登录</b></h3>
                        <input onChange={this.handleUsername} value={this.state.username} className="w3-input w3-border" type="text" placeholder="用户名"/>
                        <input onChange={this.handlePassword} value={this.state.password} className="w3-input w3-border w3-margin-top" type="password" placeholder="密码"/>
                        <button onClick={this.loginVerify} className="w3-button w3-green w3-margin-top"><b>登录</b></button>
                        <p onClick={this.showRegisterView} className="et-register-button">立即注册!</p>
                    </div>
                </div>
            </div>
        )
    }
}

export default Login
