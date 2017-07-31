import React, { Component } from 'react'
import './css/App.css'
import './css/w3.css'
import $ from 'jquery'
import './css/font-awesome.min.css'
import SelectBar from './SelectBar.js'
import SelectedImage from './SelectedImage.js'
import TagView from './TagView.js'
//import { saveAs } from 'file-saver' when you want to save as txt on the localhost

class App extends Component {
    state = {
        defaultURL: 'http://demo.codvision.com:16831/api/',
        imageList: [{url: 'http://192.168.0.103:8031/static/user/fj/task1/data/zhong1_12.jpg', name: 'ding1_6.jpg', labeled: 0}],
        tagList: [
            // {x_start: 0, y_start: 0, x_end: 10, y_end: 20, tag: 'car', info: '浙F1234567'} result format
        ],
        currentTagString: '1',
        selectedImageNum: 0,
        start: 1,
        num: 20,
        complete: 0
    }
    componentDidMount() {
        const that = this;
        this.getImageList();
        ///let user can select directory
        /*
            $('#file').attr('webkitdirectory', 'webkitdirectory');
            $('#file').attr('directory', 'directory');
        */

        //bind upload and show events
        $('#file').on('change', function() {
            const files = this.files;
            //let loadCount = 0; --------maybe use loadCount to setState per 50 times
            for(const file of files) {
                //decide the file is a image or not
                if(file.type === 'image/jpeg' || file.type === 'image/png') {
                    const name = file.name;
                    const reader = new FileReader()
                    reader.onload = function() {
                        const url = this.result;
                        that.setState(that.concatNewImage(url, name));
                    }
                    reader.readAsDataURL(file);
                }
            }
            that.uploadImageFiles(files);
        })
    }

    uploadImageFiles = (files) => {
        const that = this;
        for(const file of files) {
            if(!file.type.match('image.*')) {
                continue;
            }
            const formData = new FormData();
            formData.append("file", file);
            const fileRequest = new XMLHttpRequest();
            fileRequest.open('POST', `${that.state.defaultURL}uploadfile?usrname=fj&taskname=task1&filename=${file.name}`);
            fileRequest.send(formData);
            fileRequest.onload = function() {
                console.log('post image success.');
                that.refs.selectedImage.getFileCount();
                that.refs.selectedImage.getTagedFileCount();
            }
            fileRequest.onerror = function() {
                console.log('post image failed.');
            }
        }

    }

    getImageList = () => {
        this.setState({selectedImageNum: 0, tagList: []});
        const that = this;
        //load imageList from server
        const xhr = new XMLHttpRequest();
        xhr.open('GET', `${that.state.defaultURL}getdir?usrname=fj&taskname=task1&start=${this.state.start}&num=${this.state.num}`);
        xhr.onload = function() {
            console.log('getImageList success');
            const newImageList = [];
            if(xhr.response) {
                const jsonResponse = JSON.parse(xhr.response);
                jsonResponse.map((image) => {
                    newImageList.push({url: image.url, name: image.name, labeled: image.labeled});
                })
            }
            that.setState({imageList: newImageList});
            that.getTagList(0)
        }
        xhr.onerror = function() {
            console.log('get imageList failed');
            that.getTagList(0);
        }
        xhr.send();
    }

    nextImageList = () => {
        const that = this;
        const maxValue = that.refs.selectedImage.state.fileCount;
        //load imageList from server
        const xhr = new XMLHttpRequest();
        //it is doesn't matter send a number larger than the maxValue, server side will detect it
        xhr.open('GET', `${that.state.defaultURL}getdir?usrname=fj&taskname=task1&start=${this.state.start + this.state.num}&num=${this.state.num}`);
        xhr.onload = function() {
            console.log('getNextList success');
            const newImageList = [];
            if(xhr.response) {
                const jsonResponse = JSON.parse(xhr.response);
                jsonResponse.map((image) => {
                    newImageList.push({url: image.url, name: image.name, labeled: image.labeled});
                })
            }
            that.setState((state) => {
                state.start = state.start + state.num > maxValue ? maxValue : state.start + state.num;
                state.selectedImageNum = 0;
                state.tagList = [];
                state.imageList = newImageList;
            })
            that.getTagList(0)
        }
        xhr.onerror = function() {
            console.log('getNextList failed');
            that.getTagList(0);
        }
        xhr.send();

    }

    previousImageList = () => {
        const that = this;
        //load imageList from server
        const xhr = new XMLHttpRequest();
        xhr.open('GET', `${that.state.defaultURL}getdir?usrname=fj&taskname=task1&start=${(this.state.start - this.state.num) > 0 ? (this.state.start - this.state.num) : 1}&num=${this.state.num}`);
        xhr.onload = function() {
            console.log('getNextList success');
            const newImageList = [];
            if(xhr.response) {
                const jsonResponse = JSON.parse(xhr.response);
                jsonResponse.map((image) => {
                    newImageList.push({url: image.url, name: image.name, labeled: image.labeled});
                })
            }
            that.setState((state) => {
                state.start = state.start - state.num > 0 ? state.start - state.num : 1;
                state.selectedImageNum = 0;
                state.tagList = [];
                state.imageList = newImageList;
            })
            that.getTagList(0)
        }
        xhr.onerror = function() {
            console.log('getNextList failed');
            that.getTagList(0);
        }
        xhr.send();
    }

    deleteImage = () => {
        const that = this;
        const result = window.confirm("确定删除这张图片吗?");
        if(result) {
            if(this.state.selectedImageNum !== 0) {
                //delete image from server
                const deleteRequest = new XMLHttpRequest();
                deleteRequest.open('GET', `${that.state.defaultURL}/delfile?usrname=fj&taskname=task1&filename=${this.state.imageList[this.state.selectedImageNum].name}`);
                deleteRequest.send();
                //delete image from imageList
                this.setState((state) => {
                    state.imageList.splice(state.selectedImageNum, 1);
                    state.selectedImageNum = state.selectedImageNum - 1;
                })
            } else {
                //select the first one
                if(this.state.imageList.length > 0) {
                    //delete image from server
                    const deleteRequest = new XMLHttpRequest();
                    deleteRequest.open('GET', `${that.state.defaultURL}delfile?usrname=fj&taskname=task1&filename=${this.state.imageList[this.state.selectedImageNum].name}`);
                    deleteRequest.send();
                    //delete image from imageList
                    this.setState((state) => {
                        state.imageList.splice(state.selectedImageNum, 1);
                        state.selectedImageNum = 0;
                    })
                }
            }
            this.refs.selectedImage.getFileCount();
            this.refs.selectedImage.getTagedFileCount();
        }
    }

    concatNewImage = (url, name) => {
        return (preState) => {
            return {
                imageList: preState.imageList.concat([{url: url, name: name}])
            };
        };
    }

    clickItem = (url) => {
        const preIndex = this.state.selectedImageNum;
        const that = this;
        for(let i=0; i<this.state.imageList.length; i++) {
            if(this.state.imageList[i].url === url) {
                this.setState((state) => {
                    state.selectedImageNum = i
                    if(preIndex !== i) {
                        that.saveTagList(preIndex);
                        that.getTagList(i);
                    }
                })
                break
            }
        }
    }

    getTagList = (index) => {
        const that = this;
        const tagListRequest = new XMLHttpRequest();
        tagListRequest.open('GET', `${that.state.defaultURL}loadlabel?usrname=fj&taskname=task1&filename=${this.state.imageList[index].name}`);
        tagListRequest.send();
        tagListRequest.onload = function() {
            console.log('getBoxList success.');
            const jsonResponse = JSON.parse(tagListRequest.response);
            if(jsonResponse.length > 0) {
                that.setState({tagList: jsonResponse.objects});
            } else {
                that.setState({tagList: []});
            }
        }
        tagListRequest.onerror = function() {
            console.log('get boxList error.');
            that.setState({tagList: []});
        }
    }

    saveTagList = (index) => {
        if(this.state.tagList.length > 0) {
            this.setState((state) => {
                state.imageList[index].labeled = 1;
            })
            const that = this;
            const saveTagListRequest = new XMLHttpRequest();
            saveTagListRequest.open('POST', `${that.state.defaultURL}savelabel?usrname=fj&taskname=task1&filename=${this.state.imageList[index].name}`);
            const result = `{
                "length": ${this.state.tagList.length},
                "objects": [
                    ${this.state.tagList.map((tag) => (
                        `{
                            "x_start": ${tag.x_start},
                            "y_start": ${tag.y_start},
                            "x_end": ${tag.x_end},
                            "y_end": ${tag.y_end},
                            "tag": "${tag.tag}",
                            "info": "${tag.info ? tag.info : ''}"
                        }`
                    ))}
                ]
            }`
            saveTagListRequest.send(result);
            saveTagListRequest.onload = function() {
                console.log('post taglist success.');
                that.refs.selectedImage.getTagedFileCount();
            }
            saveTagListRequest.onerror = function() {
                console.log('post taglist error.');
            }
        }
    }

    // saveResult = () => {
    //     // let result = `{length: ${this.state.tagList.length} }`
    //     // this.state.tagList.map((tag) => {
    //     //     const x_start = tag.x_start
    //     //     const y_start = tag.y_start
    //     //     const x_end = tag.x_end
    //     //     const y_end = tag.y_end
    //     //     const tag = tag.tag
    //     //     result = result.concat(`${x_start} `).concat(`${y_start} `).concat(`${x_end} `).concat(`${y_end} `).concat(tag).concat('\n')
    //     // })
    //     const result = `{
    //         "length": ${this.state.tagList.length},
    //         "objects": [
    //             ${this.state.tagList.map((tag) => (
    //                 `{
    //                     "x_start": ${tag.x_start},
    //                     "y_start": ${tag.y_start},
    //                     "x_end": ${tag.x_end},
    //                     "y_end": ${tag.y_end},
    //                     "tag": "${tag.tag}"
    //                 }`
    //             ))}
    //         ]
    //     }`
    //
    //     //var blob = new Blob([result], {type: "text/plain;charset=utf-8"});
    //     //saveAs(blob, `${this.state.imageList[this.state.selectedImageNum].name}.txt`);
    //     $.ajax({
    //         url: 'http://192.168.0.118:8888/api/v1.0',
    //         type: 'POST',
    //         headers: {
    //             'Content-Type': 'application/json'
    //         },
    //         data: result,
    //         dataType: 'text/plain',
    //         success: function(data) {
    //             console.log(data)
    //         },
    //         error: function(data) {
    //             console.log(data)
    //         }
    //     })
    // }

    addTag = (tag) => {
        this.setState((state) => {
            state.tagList = state.tagList.concat([tag])
        })
    }

    deleteBox = (index) => {
        const that = this;
        this.setState((state) => {
            state.tagList.splice(index, 1);
        }, function() {
            //if delete the last box, tagList will be empty, and don't post the save request.
            if(that.state.tagList.length === 0) {
                const deleteLabel = new XMLHttpRequest();
                deleteLabel.open('GET', `${that.state.defaultURL}dellabel?usrname=fj&taskname=task1&filename=${that.state.imageList[that.state.selectedImageNum].name}`);
                deleteLabel.send();
                deleteLabel.onload = function() {
                    console.log('delete last box success');
                }
                //delete last box, change the imageList's labeled state.
                that.setState((state) => {
                    state.imageList[that.state.selectedImageNum].labeled = 0;
                })
            }
        })
    }

    changeBoxInfo = (index, value) => {
        this.setState((state) => {
            state.tagList[index].info = value;
        })
    }

    changeTagString = () => {
        this.setState({currentTagString: $('#mySelect').val()})
    }

    handleNumChange = (e) => {
        const value = e.target.value;
        this.setState((state) => {
            if(value.trim() === '' || parseInt(value, 10) <= 0) {
                state.num = 1;
            } else if(parseInt(value, 10) > 999999) {
                state.num = 999999;
            } else {
                state.num = parseInt(value, 10);
            }
        });
    }

    handleStartChange = (e) => {
        const value = e.target.value;
        const that = this;
        const maxValue = that.refs.selectedImage.state.fileCount;
        this.setState((state) => {
            if(value.trim() === '' || parseInt(value, 10) <= 0) {
                state.start = 1;
            } else if(parseInt(value, 10) > maxValue) {
                state.start = maxValue;
            } else {
                state.start = parseInt(value, 10);
            }
        });
    }

    render() {
        return (
            <div className="App flex-box full-height">
                <div className="flex-box flex-column full-height" style={{flex: '1 1 auto', width: '80%'}}>
                    <SelectedImage ref="selectedImage"
                                   num={this.state.num}
                                   info={this.state.info}
                                   currentTagString={this.state.currentTagString}
                                   onAddTag={this.addTag}
                                   selectedImage={this.state.imageList[this.state.selectedImageNum].url}
                                   selectedImageName={this.state.imageList[this.state.selectedImageNum].name}
                                   selectedImageNumInAll={this.state.start + this.state.selectedImageNum}
                                   complete={this.state.complete}
                                   onDeleteImage={this.deleteImage}
                                   boxList={this.state.tagList}/>
                    <SelectBar onClickItem={this.clickItem} selectedImageNum={this.state.selectedImageNum} imageList={this.state.imageList}/>
                </div>
                <div className="flex-box flex-column" style={{width: '20%', backgroundColor: '#F0F0F0'}}>
                    <TagView onHandleNumChange={this.handleNumChange}
                             onHandleStartChange={this.handleStartChange}
                             start={this.state.start}
                             num={this.state.num}
                             info={this.state.info}
                             currentTagString={this.state.currentTagString}
                             onChangeTagString={this.changeTagString}
                             onGetImageList={this.getImageList}
                             onNextImageList={this.nextImageList}
                             onPreviousImageList={this.previousImageList}
                             boxList={this.state.tagList}
                             onDeleteBox={this.deleteBox}
                             onChangeBoxInfo={this.changeBoxInfo}/>
                </div>
            </div>
        )
  }
}

export default App
