import React, { Component } from 'react';
import CheckReviewSelector from './CheckReviewSelector';
import AutoTagView from './AutoTagView';
import SearchButton from './SearchButton';
import SetReasonView from './tagPage/popups/SetReasonView';

class TagView extends Component {
    state = {
        listNameList: [], // 'tagname','tagname2'
        tagStringList: [], // '1','2','3'
        tagStringListAll: {}, // {tagname: ['1','2','3'], tagname2: ['4','5','6']}
        newTagString: '',
        newListName: '',
        showEditView: false,
        showTagEditView: false,
        showListNameEditView: false,
        showAddNewTagStringView: false,
        showAddNewListNameView: false,
        autoTagNum: 1,
        autoTagStart: 1,
        showAutoTagView: false,
        pretrainmodelList: [],
        boxImgList: {}, //use key-value so this is object not array
        reasonList: [], //review reasons
        showSetReasonView: false
    }

    shouldShowSetReasonView = () => {
      this.setState({
        showSetReasonView: !this.state.showSetReasonView
      })
    }

    openAutoTagView = () => {
      this.setState({
        showAutoTagView: true
      })
    }

    closeAutoTagView = () => {
      this.setState({
        showAutoTagView: false
      })
    }

    changeAutoTagStart = (index) => {
      this.setState({
        autoTagStart: index
      })
    }

    handleAutoTagNum = (e) => {
      this.setState({
        autoTagNum: e.target.value
      })
    }

    handleAutoTagStart = (e) => {
      this.setState({
        autoTagStart: e.target.value
      })
    }

    shouldShowEditView = () => {
        this.setState({showEditView: !this.state.showEditView});
    }

    shouldShowListNameEditView = () => {
        this.setState({
          newListName: '',
          showListNameEditView: !this.state.showListNameEditView
        });
    }

    shouldShowTagEditView = () => {
        this.setState({
          newTagString: '',
          showTagEditView: !this.state.showTagEditView
        });
    }

    shouldShowAddNewTagStringView = () => {
        this.setState({showAddNewTagStringView: !this.state.showAddNewTagStringView});
    }

    shouldShowAddNewListNameView = () => {
        this.setState({showAddNewListNameView: !this.state.showAddNewListNameView});
    }

    componentWillUnmount() {
        document.removeEventListener('keyup', this.pageUpAndDownListener);
    }

    componentDidMount() {
        this.loadTagList();
        this.getReviewReason();
        document.addEventListener('keyup', this.pageUpAndDownListener);
    }

    getReviewReason = () => {
      fetch(`${this.props.defaultURL}loadreason?usrname=${this.props.userName}&taskname=${this.props.taskName}`)
        .then(response => response.json())
        .then((result) => {
          this.setState({
            reasonList: result.reasonlist
          })
        })
    }

    addNewReason = (reason) => {
      fetch(`${this.props.defaultURL}savereason?usrname=${this.props.userName}&taskname=${this.props.taskName}`, {
        method: 'POST',
        body: JSON.stringify({
          reasonlist: this.state.reasonList.concat([reason])
        })
      })
        .then(response => response.text())
        .then((result) => {
          this.getReviewReason();
        })
    }

    deleteReason = (index) => {
      const reasonList = this.state.reasonList;
      reasonList.splice(index, 1);
      fetch(`${this.props.defaultURL}savereason?usrname=${this.props.userName}&taskname=${this.props.taskName}`, {
        method: 'POST',
        body: JSON.stringify({
          reasonlist: reasonList
        })
      })
        .then(response => response.text())
        .then((result) => {
          this.getReviewReason();
        })
    }

    componentDidUpdate(preProps, preState) {
      if(this.props.boxList !== preProps.boxList) {
        this.setState({
          boxImgList: {}
        }, () => {
          for(let i=0; i<this.props.boxList.length; i++) {
            this.getBoxImg(this.props.boxList[i], i);
          }
        })
      }
    }

    pageUpAndDownListener = (e) => {
        if(e.keyCode === 33) {
            this.props.onPreviousImageList();
        } else if(e.keyCode === 34) {
            this.props.onNextImageList();
        }
    }

    addTagString = () => {
        const tagString = document.getElementById('new-tag-string').value;
        if(tagString.trim() !== '') {
            document.getElementById('new-tag-string').value = '';
            this.setState((state) => {
                state.tagStringList = state.tagStringList.concat([tagString]);
                state.tagStringListAll[document.getElementById('mySelectForListName').value] = state.tagStringList;
            }, () => this.saveTagList())
            this.shouldShowAddNewTagStringView();
        } else {
            window.alert('标签名不能为空');
        }
    }

    addListName = () => {
        const listName = document.getElementById('new-list-name').value;
        if(listName.trim() !== '') {
            document.getElementById('new-list-name').value = '';
            this.setState((state) => {
                state.listNameList = state.listNameList.concat([listName]);
                state.tagStringListAll[listName] = ['None'];
            }, () => this.saveTagList())
            this.shouldShowAddNewListNameView();
        } else {
            window.alert('标签组名不能为空');
        }
    }

    deleteCurrentTag = () => {
        const result = window.confirm('确定删除当前标签吗?');
        if(result) {
            if(this.state.tagStringList.length === 1) {
                window.alert('不能删除最后一个标签');
            }else {
                const index = this.state.tagStringList.indexOf(this.props.currentTagString);
                this.setState((state) => {
                    state.tagStringList.splice(index, 1);
                }, () => {
                    this.saveTagList();
                    this.props.onChangeTagString();
                })
            }
        }
    }

    deleteCurrentListName = () => {
        const result = window.confirm('确定删除当前标签组吗?');
        if(result) {
            if(this.state.listNameList.length === 1) {
                window.alert('不能删除最后一个标签组');
            }else {
                const listName = document.getElementById('mySelectForListName').value;
                const index = this.state.listNameList.indexOf(listName);
                this.setState((state) => {
                    state.listNameList.splice(index, 1);
                    delete state.tagStringListAll[listName];
                }, () => {
                    this.saveTagList();
                    this.updateTagStringList();
                })
            }
        }
    }

    updateTagStringList = () => {
        const listName = document.getElementById('mySelectForListName').value;
        this.setState({tagStringList: this.state.tagStringListAll[listName]}, () => {this.props.onChangeTagString()});
    }

    saveTagList = () => {
        const request = new XMLHttpRequest();
        request.open('POST', `${this.props.defaultURL}savetag?usrname=${this.props.userName}&taskname=${this.props.taskName}`);
        request.send(JSON.stringify({
            listname: this.state.listNameList,
            taglist: this.state.tagStringListAll
        }));
        request.onload = () => {
            console.log('post tagStringList success');
        }
    }

    loadTagList = () => {
        const request = new XMLHttpRequest();
        request.open('GET', `${this.props.defaultURL}loadtag?usrname=${this.props.userName}&taskname=${this.props.taskName}`);
        request.send();
        request.onload = () => {
            console.log('getTagStringList success');
            const data = JSON.parse(request.response);
            const listNameList = data.listname;
            const tagStringListAll = data.taglist;
            const tagStringList = data.taglist[listNameList[0]];
            this.setState({listNameList, tagStringList, tagStringListAll}, () => {
                this.props.onChangeTagString();
            })
        }
    }

    onDeleteBox = (index) => {
        this.props.onDeleteBox(index);
        const newBoxImgList = this.state.boxImgList;
        delete newBoxImgList[index];
        const keyList = Object.keys(newBoxImgList);
        const max = Math.max(...keyList);
        let tag = false;
        for(let i=index + 1; i<=max; i++) {
          tag = true;
          newBoxImgList[i - 1] = newBoxImgList[i];
        }
        if(tag) delete newBoxImgList[max];
        this.setState({
          boxImgList: newBoxImgList
        })
    }

    onChangeBoxInfo(index, e) {
        this.props.onChangeBoxInfo(index, e.target.value);
    }

    getImageListByTag = () => {
        if(this.state.targetTag.trim() !== '') {
            this.props.getImageListByTag(this.state.targetTag);
            this.setState({targetTag: ''})
        }
    }

    handleNewTagString = (e) => {
        this.setState({newTagString: e.target.value});
    }

    handleNewListName = (e) => {
        this.setState({newListName: e.target.value});
    }

    editTagString = () => {
        if(this.state.newTagString.trim() !== '') {
            const oldTagString = document.getElementById('mySelect').value;
            const newTagString = this.state.newTagString;
            this.setState((state) => {
                const newTagStringList = state.tagStringList.reduce((newTagStringList, tagString) => {
                    if(tagString === oldTagString) {
                        return newTagStringList.concat([newTagString]);
                    } else {
                        return newTagStringList.concat([tagString]);
                    }
                }, []);
                state.tagStringList = newTagStringList;
                state.tagStringListAll[document.getElementById('mySelectForListName').value] = newTagStringList;
                state.newTagString = '';
            }, () => {
                this.saveTagList();
                this.props.editTagString(oldTagString, newTagString);
                this.props.onChangeTagString();
                this.shouldShowTagEditView();
            });
        } else {
            window.alert('新标签名不能为空');
        }
    }

    editListName = () => {
        const theNewListName = this.state.newListName;
        if(this.state.newListName.trim() !== '') {
            const oldListName = document.getElementById('mySelectForListName').value;
            const newListName = this.state.newListName;
            this.setState((state) => {
                const index = state.listNameList.indexOf(oldListName);
                state.listNameList[index] = newListName;
                state.tagStringListAll = {
                    ...state.tagStringListAll,
                    [newListName]: state.tagStringListAll[oldListName]
                }
                delete state.tagStringListAll[oldListName];
                state.newListName = '';
            }, () => {
                document.getElementById('mySelectForListName').value = theNewListName;
                this.saveTagList();
                this.shouldShowListNameEditView();
            });
        } else {
            window.alert('新标签组名不能为空');
        }
    }

    changeTagStringList = () => {
        const listName = document.getElementById('mySelectForListName').value;
        this.setState({tagStringList: this.state.tagStringListAll[listName]}, () => {
            this.props.onChangeTagString();
        });
    }

    autoTagImages = (pretrainmodel) => {
      this.props.onAutoTagImages(this.state.autoTagStart, this.state.autoTagNum, pretrainmodel);
      this.closeAutoTagView();
    }

    inferLabel = () => {
      setTimeout(() => {
        const index = this.props.selectedImageNum;
        this.props.getImageList(() => {
          this.props.clickItem(this.props.imageList[index].url);
        });
      }, 3000);
      this.closeAutoTagView();
    }

    getBoxImg = (box, index) => {
      const canvas = document.createElement('canvas');
      const img = new Image();
      img.onload = () => {
        const startX = img.width * box.x_start;
        const endX = img.width * box.x_end;
        const width = endX - startX;
        const startY = img.height * box.y_start;
        const endY = img.height * box.y_end;
        const height = endY - startY;
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, startX, startY, width, height, 0, 0, canvas.width, canvas.height);
        this.setState({
          boxImgList: {
            ...this.state.boxImgList,
            [index]: canvas.toDataURL()
          }
        })
      }
      img.setAttribute('crossOrigin', 'anonymous');
      img.src = this.props.selectedImage;
    }

    exitFindMode = () => {
      this.props.onChangeBrowserMode('normal');
    }

    findByTag = () => {
      this.props.onChangeBrowserMode('find');
    }

    findByMode = (mode) => {
      this.props.onChangeBrowserMode(mode);
    }

    render() {
        return (
            <div className="flex-box flex-column" style={{justifyContent: 'center', height: '100%'}}>
                {this.state.showSetReasonView && <SetReasonView
                  reasonList={this.state.reasonList}
                  closeView={this.shouldShowSetReasonView}
                  addNewReason={this.addNewReason}
                  deleteReason={this.deleteReason} />}
                <AutoTagView
                  open={this.state.showAutoTagView}
                  closeView={this.closeAutoTagView}
                  index={(this.props.selectedImageNumInAll)}
                  autoTagImages={this.autoTagImages}
                  inferLabel={this.inferLabel} />
                <SearchButton
                    exitFindMode={this.exitFindMode}
                    findByTag={this.findByTag}
                    findByMode={this.findByMode} />
                <div className="flex-box margin-top-5">
                    <select onChange={this.changeTagStringList} id="mySelectForListName" className="w3-select" style={{width: '50%'}}>
                    {
                        this.state.listNameList.map((listName, index) => (
                            <option key={listName + index}>{listName}</option>
                        ))
                    }
                    </select>
                    <div style={{backgroundColor: 'rgb(211, 204, 204)', width: '2px'}}></div>
                    <select onChange={this.props.onChangeTagString} id="mySelect" className="w3-select" style={{width: '50%'}}>
                    {
                        this.state.tagStringList.map((tagString, index) => (
                            <option key={tagString + index}>{tagString}</option>
                        ))
                    }
                    </select>
                </div>
                {
                    this.props.userLevel !== 0 ?
                        this.state.showEditView ?
                            this.props.userLevel === 3 || this.props.userLevel === 2 ?
                                this.state.showListNameEditView ?
                                <div className="flex-box w3-card margin-top-5">
                                    <input onChange={this.handleNewListName} value={this.state.newListName} placeholder="请输入新的标签组名" className="w3-input" type="text"/>
                                    <button onClick={this.editListName} className="w3-button w3-green" style={{width: '26%'}}>确定</button>
                                    <div style={{backgroundColor: 'rgb(211, 204, 204)', width: '2px'}}></div>
                                    <button onClick={this.shouldShowListNameEditView} className="w3-button w3-green" style={{width: '26%'}}>取消</button>
                                </div>
                                : <button onClick={this.shouldShowListNameEditView} className="w3-card w3-button w3-green margin-top-5">修改当前标签组名</button>
                            : null
                        :null
                    :null
                }
                {
                    this.props.userLevel !== 0 ?
                        this.state.showEditView ?
                            this.props.userLevel === 3 || this.props.userLevel === 2 ?
                                this.state.showTagEditView ?
                                <div className="flex-box w3-card margin-top-5">
                                    <input onChange={this.handleNewTagString} value={this.state.newTagString} placeholder="请输入新的标签名" className="w3-input" type="text"/>
                                    <button onClick={this.editTagString} className="w3-button w3-green" style={{width: '26%'}}>确定</button>
                                    <div style={{backgroundColor: 'rgb(211, 204, 204)', width: '2px'}}></div>
                                    <button onClick={this.shouldShowTagEditView} className="w3-button w3-green" style={{width: '26%'}}>取消</button>
                                </div>
                                : <button onClick={this.shouldShowTagEditView} className="w3-card w3-button w3-green margin-top-5">修改当前标签名</button>
                            : null
                        :null
                    :null
                }
                {
                    this.props.userLevel !== 0 ?
                        this.state.showEditView ?
                            this.state.showAddNewListNameView ?
                                <div className="w3-card margin-top-5 flex-box">
                                    <input placeholder="请输入新的标签组名" id="new-list-name" className="w3-input" type="text"/>
                                    <button className="w3-button w3-green" onClick={this.addListName} style={{width: '26%'}}>确定</button>
                                    <div style={{backgroundColor: 'rgb(211, 204, 204)', width: '2px'}}></div>
                                    <button className="w3-button w3-green" onClick={this.shouldShowAddNewListNameView} style={{width: '26%'}}>取消</button>
                                </div>
                                : <button onClick={this.shouldShowAddNewListNameView} className="w3-button w3-green w3-card margin-top-5">添加新标签组</button>
                        : null
                    :null
                }
                {
                    this.props.userLevel !== 0 ?
                        this.state.showEditView ?
                            this.state.showAddNewTagStringView ?
                                <div className="w3-card margin-top-5 flex-box">
                                    <input placeholder="请输入新的标签名" id="new-tag-string" className="w3-input" type="text"/>
                                    <button className="w3-button w3-green" onClick={this.addTagString} style={{width: '26%'}}>确定</button>
                                    <div style={{backgroundColor: 'rgb(211, 204, 204)', width: '2px'}}></div>
                                    <button className="w3-button w3-green" onClick={this.shouldShowAddNewTagStringView} style={{width: '26%'}}>取消</button>
                                </div>
                                : <button onClick={this.shouldShowAddNewTagStringView} className="w3-button w3-green w3-card margin-top-5">添加新标签</button>
                        : null
                    :null
                }
                {
                    this.props.userLevel !== 0 ?
                        this.state.showEditView ?
                            <div className="flex-box flex-column">
                                <button onClick={this.deleteCurrentListName} className="w3-card w3-button w3-green margin-top-5">删除当前标签组</button>
                                <button onClick={this.deleteCurrentTag} className="w3-card w3-button w3-green margin-top-5">删除当前标签</button>
                                <button onClick={this.shouldShowEditView} className="w3-button w3-green w3-card margin-top-5">退出编辑</button>
                            </div>
                        :null
                    :null
                }
                {
                    this.props.userLevel !== 0 ?
                        this.state.showEditView ?
                        null
                        : <button onClick={this.shouldShowEditView} className="w3-button w3-green w3-card margin-top-5">编辑标签</button>
                    :null
                }
                <ul className="w3-ul w3-hoverable margin-top-5"  style={{overflowY: 'auto', flex: '1', padding: '0px 5px'}}>{
                    this.props.boxList.map((box, index) => (
                        <li onClick={() => this.props.changeBoxIndex(index)} className="w3-hover-green" key={box.x_start + box.y_end} style={{borderStyle: `${this.props.boxIndex === index ? 'dotted' : 'none'}`}}>
                            <div>
                                <span>序号: {index + 1}</span>
                                {box.checked
                                  ? box.checked === 'YES'
                                    ? null
                                    : <i onClick={this.onDeleteBox.bind(this, index)} className="fa fa-times et-tag-button w3-right"></i>
                                  : <i onClick={this.onDeleteBox.bind(this, index)} className="fa fa-times et-tag-button w3-right"></i>}
                            </div>
                            <div>
                                <div className="flex-box" style={{alignItems: 'center', padding: '5px 0px'}}>
                                    <span>标签: </span>
                                    <i onClick={this.props.addNewTagToBox.bind(this, index)} className="fa fa-plus-circle et-tag-button"></i>
                                    <div className="flex-box" style={{overflowX: 'auto', marginLeft: '4px'}}>{
                                        box.tag.map((tag, index2) => (
                                            <div key={tag + index2} className="flex-box" style={{border: '2px solid black', alignItems: 'center', marginLeft: '2px', paddingLeft: '3px', paddingRight: '3px', whiteSpace: 'nowrap'}}>
                                                {tag}
                                                {box.checked
                                                  ? box.checked === 'YES'
                                                    ? null
                                                    : <i onClick={this.props.removeTagFromBox.bind(this, index, index2)} className="fa fa-times et-tag-button"></i>
                                                  : <i onClick={this.props.removeTagFromBox.bind(this, index, index2)} className="fa fa-times et-tag-button"></i>}
                                            </div>
                                        ))
                                    }</div>
                                </div>
                            </div>
                            <div>额外信息:<input className="w3-input" type="text" onChange={this.onChangeBoxInfo.bind(this, index)} value={this.props.boxList[index].info}/></div>
                            <img src={this.state.boxImgList[index]} style={{maxWidth: '100%', marginTop: '5px', maxHeight: '80px'}} alt="tag-content" />
                            {this.props.userLevel > 0 &&
                              <CheckReviewSelector
                                openSetReasonView={this.shouldShowSetReasonView}
                                reasonList={this.state.reasonList}
                                value={box.checked ? box.checked : '' }
                                reason={box.reason ? box.reason : ''}
                                changeReviewState={this.props.changeReviewState}
                                changeReason={this.props.changeReason}
                                index={index}/>}
                            {this.props.userLevel === 0 &&
                              <div>
                                {box.checked
                                  ? box.checked === 'YES'
                                    ? <p style={{color: 'green'}}>审核通过</p>
                                    : <div>
                                      <p style={{color: 'red'}}>审核未通过</p>
                                      <p>{`原因：${box.reason}`}</p>
                                    </div>
                                  : <p style={{color: 'orange'}}>待审核</p>}
                              </div>}
                        </li>
                    ))
                }</ul>
                <div>
                  <div className="flex-box margin-top-5 w3-card">
                      <span style={{padding: '0px 8px', display: 'flex', whiteSpace:'nowrap', alignItems: 'center'}}>起始<br/>序号</span>
                      <input onChange={this.handleAutoTagStart} className="w3-input" type="number" value={this.state.autoTagStart} style={{width: '30%'}}/>
                      <span style={{padding: '0px 8px', display: 'flex', whiteSpace:'nowrap', alignItems: 'center'}}>标注<br/>数量</span>
                      <input onChange={this.handleAutoTagNum} className="w3-input" type="number" value={this.state.autoTagNum} style={{width: '30%'}}/>
                      <button onClick={this.openAutoTagView} className="w3-button w3-green" style={{width: '30%'}}>自动标注</button>
                  </div>
                  <div className="flex-box margin-top-5 w3-card">
                      <span style={{padding: '0px 8px', display: 'flex', whiteSpace:'nowrap', alignItems: 'center'}}>起始<br/>序号</span>
                      <input onChange={this.props.onHandleStartChange} className="w3-input" type="number" value={this.props.start} style={{width: '30%'}}/>
                      <span style={{padding: '0px 8px', display: 'flex', whiteSpace:'nowrap', alignItems: 'center'}}>每页<br/>数量</span>
                      <input onChange={this.props.onHandleNumChange} className="w3-input" type="number" value={this.props.num} style={{width: '30%'}}/>
                      <button onClick={this.props.onGetImageList} className="w3-button w3-green" style={{width: '30%'}}>获取图片</button>
                  </div>
                  <div className="flex-box margin-top-5 w3-card">
                      <button style={{width: '50%'}} onClick={this.props.onPreviousImageList} className="w3-button w3-green">上一页</button>
                      <div style={{backgroundColor: 'rgb(211, 204, 204)', width: '2px'}}></div>
                      <button style={{width: '50%'}} onClick={this.props.onNextImageList} className="w3-button w3-green">下一页</button>
                  </div>
                </div>
            </div>
        )
    }
}

export default TagView
