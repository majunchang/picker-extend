/*!
 * pickerExtend.js
 */

(function () {
  require('./picker-extend.css')

  function getClass (dom, string) {
    return dom.getElementsByClassName(string)
  }

  // 构造器
  function PickerExtend (config) {
    this.pickerExtend
    this.wheelsData = config.wheels
    this.jsonType = false
    this.cascadeJsonData = []
    this.displayJson = []
    this.curValue = []
    this.curIndexArr = []
    this.cascade = false
    this.startY
    this.moveEndY
    this.moveY
    this.oldMoveY
    this.offset = 0
    this.offsetSum = 0
    this.oversizeBorder
    this.curDistance = []
    this.clickStatus = false
    this.isPC = true
    this.config = config
    // 只有touchStart的时候 才会改变的值 touchmove的时候 用来做判断
    this.standardDis = 0
    this.init(config)
  }

  PickerExtend.prototype = {
    constructor: PickerExtend,
    init: function (config) {
      var _this = this
      if (config.wheels[0].data.length == 0) {
        console.error(
          'pickerExtend has been successfully installed, but the data is empty and cannot be initialized.')
        return false
      }
      _this.keyMap = config.keyMap ? config.keyMap : {
        id: 'id',
        value: 'value',
        childs: 'childs',
        recommend: 'recommend'
      }
      _this.checkDataType()
      _this.renderWheels(_this.wheelsData, config.cancelBtnText,
        config.ensureBtnText)
      _this.trigger = document.querySelector(config.trigger)
      if (!_this.trigger) {
        console.error(
          'pickerExtend has been successfully installed, but no trigger found on your page.')
        return false
      }
      _this.wheel = getClass(_this.pickerExtend, 'wheel')
      _this.slider = getClass(_this.pickerExtend, 'selectContainer')
      _this.wheels = _this.pickerExtend.querySelector('.wheels')
      _this.liHeight = _this.pickerExtend.querySelector('li').offsetHeight
      _this.ensureBtn = _this.pickerExtend.querySelector('.ensure')
      _this.cancelBtn = _this.pickerExtend.querySelector('.cancel')
      _this.grayLayer = _this.pickerExtend.querySelector('.grayLayer')
      _this.popUp = _this.pickerExtend.querySelector('.content')
      _this.callback = config.callback || function () {
      }
      _this.cancel = config.cancel || function () {
      }
      _this.transitionEnd = config.transitionEnd || function () {
      }
      _this.onShow = config.onShow || function () {
      }
      _this.onHide = config.onHide || function () {
      }
      _this.initPosition = config.position || []
      _this.titleText = config.title || ''
      _this.connector = config.connector || ' '
      _this.triggerDisplayData = !(typeof (config.triggerDisplayData) ===
              'undefined') ? config.triggerDisplayData : true
      _this.trigger.style.cursor = 'pointer'
      _this.setStyle(config)
      //  增加修改样式的代码
      _this.setFilxibleStyle(config.flexibleHeight)
      _this.setTitle(_this.titleText)
      _this.checkIsPC()
      _this.checkCascade()
      _this.addListenerAll()

      if (_this.cascade) {
        _this.initCascade()
      }
      // 定位 初始位置
      if (_this.initPosition.length < _this.slider.length) {
        var diff = _this.slider.length - _this.initPosition.length
        for (var i = 0; i < diff; i++) {
          _this.initPosition.push(0)
        }
      }

      _this.setCurDistance(_this.initPosition)

      // 按钮监听
      _this.cancelBtn.addEventListener('click', function () {
        _this.hide()
        _this.cancel(_this.curIndexArr, _this.curValue)
      })

      _this.ensureBtn.addEventListener('click', function (event) {
        event.preventDefault()
        _this.hide()
        if (!_this.liHeight) {
          _this.liHeight = _this.pickerExtend.querySelector(
            'li').offsetHeight
        }
        var tempValue = ''
        for (var i = 0; i < _this.wheel.length; i++) {
          i == _this.wheel.length - 1
            ? tempValue += _this.getInnerHtml(i)
            : tempValue += _this.getInnerHtml(i) + _this.connector
        }
        if (_this.triggerDisplayData) {
          _this.trigger.innerHTML = tempValue
        }
        _this.curIndexArr = _this.getIndexArr()
        _this.curValue = _this.getCurValue()
        _this.callback(_this.curIndexArr, _this.curValue)
      })

      _this.trigger.addEventListener('click', function () {
        _this.show()
      })
      _this.grayLayer.addEventListener('click', function () {
        _this.hide()
        _this.cancel(_this.curIndexArr, _this.curValue)
      })
      _this.popUp.addEventListener('click', function () {
        event.stopPropagation()
      })

      _this.fixRowStyle() // 修正列数
    },

    setTitle: function (string) {
      var _this = this
      _this.titleText = string
      _this.pickerExtend.querySelector(
        '.title').innerHTML = _this.titleText
    },

    setStyle: function (config) {
      var _this = this
      if (config.ensureBtnColor) {
        _this.ensureBtn.style.color = config.ensureBtnColor
      }
      if (config.cancelBtnColor) {
        _this.cancelBtn.style.color = config.cancelBtnColor
      }
      if (config.titleColor) {
        _this.title = _this.pickerExtend.querySelector('.title')
        _this.title.style.color = config.titleColor
      }
      if (config.textColor) {
        _this.panel = _this.pickerExtend.querySelector('.panel')
        _this.panel.style.color = config.textColor
      }
      if (config.titleBgColor) {
        _this.btnBar = _this.pickerExtend.querySelector('.btnBar')
        _this.btnBar.style.backgroundColor = config.titleBgColor
      }
      if (config.bgColor) {
        _this.panel = _this.pickerExtend.querySelector('.panel')
        _this.shadowMask = _this.pickerExtend.querySelector(
          '.shadowMask')
        _this.panel.style.backgroundColor = config.bgColor
        _this.shadowMask.style.background = 'linear-gradient(to bottom, ' +
                  config.bgColor + ', rgba(255, 255, 255, 0), ' +
                  config.bgColor + ')'
      }
      if (!isNaN(config.maskOpacity)) {
        _this.grayMask = _this.pickerExtend.querySelector('.grayLayer')
        _this.grayMask.style.background = 'rgba(0, 0, 0, ' +
                  config.maskOpacity + ')'
      }
    },
    setFilxibleStyle: function (flexibleHeight) {
      var height = flexibleHeight || 40
      var _this = this
      this.pickerExtend.style.display = 'none'
      var arr = _this.pickerExtend.getElementsByTagName('li')
      for (var i = 0; i < arr.length; i++) {
        arr[i].style.height = height + 'px'
        arr[i].style.lineHeight = height + 'px'
      }
      _this.liHeight = height
      //  设置类目选中类目上下的横划线
      _this.pickerExtend.getElementsByClassName(
        'selectLine')[0].style.height = height + 'px'
      _this.pickerExtend.getElementsByClassName(
        'selectLine')[0].style.top = 2 * height + 'px'
      //  设置 wheels  wheel的height
      this.wheels.style.height = 5 * height + 'px'
      for (var i = 0; i < this.wheel.length; i++) {
        this.wheel[i].style.height = 5 * height + 'px'
      }
      _this.pickerExtend.querySelector('.shadowMask').style.height = 5 *
              height + 'px'
      this.pickerExtend.style.display = 'block'
    },
    checkIsPC: function () {
      var _this = this
      var sUserAgent = navigator.userAgent.toLowerCase()
      var bIsIpad = sUserAgent.match(/ipad/i) == 'ipad'
      var bIsIphoneOs = sUserAgent.match(/iphone os/i) == 'iphone os'
      var bIsMidp = sUserAgent.match(/midp/i) == 'midp'
      var bIsUc7 = sUserAgent.match(/rv:1.2.3.4/i) == 'rv:1.2.3.4'
      var bIsUc = sUserAgent.match(/ucweb/i) == 'ucweb'
      var bIsAndroid = sUserAgent.match(/android/i) == 'android'
      var bIsCE = sUserAgent.match(/windows ce/i) == 'windows ce'
      var bIsWM = sUserAgent.match(/windows mobile/i) == 'windows mobile'
      if ((bIsIpad || bIsIphoneOs || bIsMidp || bIsUc7 || bIsUc ||
                  bIsAndroid || bIsCE || bIsWM)) {
        _this.isPC = false
      }
    },

    show: function () {
      this.pickerExtend.classList.add('pickerExtend-show')
      if (typeof this.onShow === 'function') {
        this.onShow(this)
      }
    },

    hide: function () {
      this.pickerExtend.classList.remove('pickerExtend-show')
      if (typeof this.onHide === 'function') {
        this.onHide(this)
      }
    },

    renderWheels: function (wheelsData, cancelBtnText, ensureBtnText) {
      var _this = this
      var cancelText = cancelBtnText || '取消'
      var ensureText = ensureBtnText || '确认'
      _this.pickerExtend = document.createElement('div')
      _this.pickerExtend.className = 'pickerExtend'
      _this.pickerExtend.innerHTML =
              '<div class="grayLayer"></div>' +
              '<div class="content">' +
              '<div class="btnBar">' +
              '<div class="fixWidth">' +
              '<div class="cancel">' + cancelText + '</div>' +
              '<div class="title"></div>' +
              '<div class="ensure">' + ensureText + '</div>' +
              '</div>' +
              '</div>' +
              '<div class="panel">' +
              '<div class="fixWidth">' +
              '<div class="wheels">' +
              '</div>' +
              '<div class="selectLine"></div>' +
              '<div class="shadowMask"></div>' +
              '</div>' +
              '</div>' +
              '</div>'
      document.body.appendChild(_this.pickerExtend)
      // 根据数据长度来渲染

      var tempHTML = ''
      for (var i = 0; i < wheelsData.length; i++) {
        // 列
        tempHTML += '<div class="wheel"><ul class="selectContainer">'
        if (_this.jsonType) {
          for (var j = 0; j < wheelsData[i].data.length; j++) {
            // 行
            tempHTML += '<li data-id="' +
                          wheelsData[i].data[j][_this.keyMap.id] + '">' +
                          wheelsData[i].data[j][_this.keyMap.value] + '</li>'
          }
        } else {
          for (var j = 0; j < wheelsData[i].data.length; j++) {
            // 行
            tempHTML += '<li class="shsihi-first">' +
                          wheelsData[i].data[j] + '</li>'
          }
        }
        tempHTML += '</ul></div>'
      }

      _this.pickerExtend.querySelector('.wheels').innerHTML = tempHTML
    },

    addListenerAll: function () {
      var _this = this
      for (var i = 0; i < _this.slider.length; i++) {
        // 手势监听
        (function (i) {
          _this.addListenerWheel(_this.wheel[i], i)
        })(i)
      }
    },

    addListenerWheel: function (theWheel, index) {
      var _this = this
      theWheel.addEventListener('touchstart', function () {
        _this.touch(event, this.firstChild, index)
      }, false)
      theWheel.addEventListener('touchend', function () {
        _this.touch(event, this.firstChild, index)
      }, false)
      theWheel.addEventListener('touchmove', function () {
        _this.touch(event, this.firstChild, index)
      }, false)

      if (_this.isPC) {
        // 如果是PC端则再增加拖拽监听 方便调试
        theWheel.addEventListener('mousedown', function () {
          _this.dragClick(event, this.firstChild, index)
        }, false)
        theWheel.addEventListener('mousemove', function () {
          _this.dragClick(event, this.firstChild, index)
        }, false)
        theWheel.addEventListener('mouseup', function () {
          _this.dragClick(event, this.firstChild, index)
        }, true)
      }
    },

    checkDataType: function () {
      var _this = this
      if (typeof (_this.wheelsData[0].data[0]) === 'object') {
        _this.jsonType = true
      }
    },

    checkCascade: function () {
      var _this = this
      if (_this.jsonType) {
        var node = _this.wheelsData[0].data
        for (var i = 0; i < node.length; i++) {
          if (_this.keyMap.childs in node[i] &&
                      node[i][_this.keyMap.childs].length > 0) {
            _this.cascade = true
            _this.cascadeJsonData = _this.wheelsData[0].data
            break
          }
        }
      } else {
        _this.cascade = false
      }
    },

    generateArrData: function (targetArr) {
      var tempArr = []
      var keyMap_id = this.keyMap.id
      var keyMap_value = this.keyMap.value
      var keyMap_recommend = this.keyMap.recommend
      for (var i = 0; i < targetArr.length; i++) {
        var tempObj = {}
        tempObj[keyMap_id] = targetArr[i][this.keyMap.id]
        tempObj[keyMap_value] = targetArr[i][this.keyMap.value]
        tempObj[keyMap_recommend] = targetArr[i][this.keyMap.recommend]
        tempArr.push(tempObj)
      }
      return tempArr
    },
    initCascade: function () {
      var _this = this
      _this.displayJson.push(_this.generateArrData(_this.cascadeJsonData))
      if (_this.initPosition.length > 0) {
        _this.initDeepCount = 0
        _this.initCheckArrDeep(
          _this.cascadeJsonData[_this.initPosition[0]])
      } else {
        _this.checkArrDeep(_this.cascadeJsonData[0])
      }
      _this.reRenderWheels()
    },

    initCheckArrDeep: function (parent) {
      var _this = this
      if (parent) {
        if (_this.keyMap.childs in parent &&
                  parent[_this.keyMap.childs].length > 0) {
          _this.displayJson.push(
            _this.generateArrData(parent[_this.keyMap.childs]))
          _this.initDeepCount++
          var nextNode = parent[_this.keyMap.childs][_this.initPosition[_this.initDeepCount]]
          if (nextNode) {
            _this.initCheckArrDeep(nextNode)
          } else {
            _this.checkArrDeep(parent[_this.keyMap.childs][0])
          }
        }
      }
    },

    checkArrDeep: function (parent) {
      // 检测子节点深度  修改 displayJson
      var _this = this
      if (parent) {
        if (_this.keyMap.childs in parent &&
                  parent[_this.keyMap.childs].length > 0) {
          _this.displayJson.push(
            _this.generateArrData(parent[_this.keyMap.childs])) // 生成子节点数组
          _this.checkArrDeep(parent[_this.keyMap.childs][0])// 检测下一个子节点
        }
      }
    },

    checkRange: function (index, posIndexArr) {
      var _this = this
      var deleteNum = _this.displayJson.length - 1 - index

      for (var i = 0; i < deleteNum; i++) {
        _this.displayJson.pop() // 修改 displayJson
      }
      var resultNode
      for (var i = 0; i <= index; i++) {
        if (i == 0) {
          resultNode = _this.cascadeJsonData[posIndexArr[0]]
        } else {
          resultNode = resultNode[_this.keyMap.childs][posIndexArr[i]]
        }
      }

      _this.checkArrDeep(resultNode)
      _this.reRenderWheels()
      _this.fixRowStyle()
      _this.setCurDistance(_this.resetPosition(index, posIndexArr))
    },

    resetPosition: function (index, posIndexArr) {
      var _this = this
      var tempPosArr = posIndexArr
      var tempCount
      if (_this.slider.length > posIndexArr.length) {
        tempCount = _this.slider.length - posIndexArr.length
        for (var i = 0; i < tempCount; i++) {
          tempPosArr.push(0)
        }
      } else if (_this.slider.length < posIndexArr.length) {
        tempCount = posIndexArr.length - _this.slider.length
        for (var i = 0; i < tempCount; i++) {
          tempPosArr.pop()
        }
      }
      for (var i = index + 1; i < tempPosArr.length; i++) {
        tempPosArr[i] = 0
      }
      return tempPosArr
    },
    reRenderWheels: function () {
      var _this = this
      // 删除多余的wheel
      if (_this.wheel.length > _this.displayJson.length) {
        var count = _this.wheel.length - _this.displayJson.length
        for (var i = 0; i < count; i++) {
          _this.wheels.removeChild(
            _this.wheel[_this.wheel.length - 1])
        }
      }

      for (var i = 0; i < _this.displayJson.length; i++) {
        // 列
        (function (i) {
          var tempHTML = ''
          if (_this.wheel[i]) {
            for (var j = 0; j < _this.displayJson[i].length; j++) {
              // 行

              if (_this.displayJson[i][j][_this.keyMap.recommend]) {
                tempHTML += '<li   data-id="' +
                                  _this.displayJson[i][j][_this.keyMap.id] +
                                  '">' +
                                  '<span class="recommendSpan">荐</span>' +
                                  _this.displayJson[i][j][_this.keyMap.value] +
                                  '</li>'
              } else {
                tempHTML += '<li   data-id="' +
                                  _this.displayJson[i][j][_this.keyMap.id] +
                                  '">' +
                                  _this.displayJson[i][j][_this.keyMap.value] +
                                  '</li>'
              }
            }
            _this.slider[i].innerHTML = tempHTML
            _this.setFilxibleStyle(_this.config.flexibleHeight)
          } else {
            var tempWheel = document.createElement('div')
            tempWheel.className = 'wheel'
            tempHTML = '<ul class="selectContainer">'
            for (var j = 0; j < _this.displayJson[i].length; j++) {
              // 行
              tempHTML += '<li  data-id="' +
                              _this.displayJson[i][j][_this.keyMap.id] +
                              '">' +
                              _this.displayJson[i][j][_this.keyMap.value] +
                              '</li>'
            }
            tempHTML += '</ul>'
            tempWheel.innerHTML = tempHTML

            _this.addListenerWheel(tempWheel, i)
            _this.wheels.appendChild(tempWheel)
            _this.setFilxibleStyle(_this.config.flexibleHeight)
          }
        })(i)
      }
    },

    updateWheels: function (data) {
      var _this = this
      if (_this.cascade) {
        _this.cascadeJsonData = data
        _this.displayJson = []
        _this.initCascade()
        if (_this.initPosition.length < _this.slider.length) {
          var diff = _this.slider.length - _this.initPosition.length
          for (var i = 0; i < diff; i++) {
            _this.initPosition.push(0)
          }
        }
        _this.setCurDistance(_this.initPosition)
        _this.fixRowStyle()
      }
    },

    updateWheel: function (sliderIndex, data) {
      var _this = this
      var tempHTML = ''
      if (_this.cascade) {
        console.error('级联格式不支持updateWheel(),请使用updateWheels()更新整个数据源')
        return false
      } else if (_this.jsonType) {
        for (var j = 0; j < data.length; j++) {
          tempHTML += '<li data-id="' + data[j][_this.keyMap.id] +
                      '">' + data[j][_this.keyMap.value] + '</li>'
        }
        _this.wheelsData[sliderIndex] = {data: data}
      } else {
        for (var j = 0; j < data.length; j++) {
          tempHTML += '<li>' + data[j] + '</li>'
        }
        _this.wheelsData[sliderIndex] = data
      }
      _this.slider[sliderIndex].innerHTML = tempHTML
    },

    fixRowStyle: function () {
      var _this = this
      var width = (100 / _this.wheel.length).toFixed(2)
      for (var i = 0; i < _this.wheel.length; i++) {
        _this.wheel[i].style.width = width + '%'
      }
    },

    getIndex: function (distance) {
      return Math.round((2 * this.liHeight - distance) / this.liHeight)
    },

    getIndexArr: function () {
      var _this = this
      var temp = []
      for (var i = 0; i < _this.curDistance.length; i++) {
        temp.push(_this.getIndex(_this.curDistance[i]))
      }
      return temp
    },

    getCurValue: function () {
      var _this = this
      var temp = []
      var positionArr = _this.getIndexArr()
      if (_this.cascade) {
        for (var i = 0; i < _this.wheel.length; i++) {
          temp.push(_this.displayJson[i][positionArr[i]])
        }
      } else if (_this.jsonType) {
        for (var i = 0; i < _this.curDistance.length; i++) {
          temp.push(_this.wheelsData[i].data[_this.getIndex(
            _this.curDistance[i])])
        }
      } else {
        for (var i = 0; i < _this.curDistance.length; i++) {
          temp.push(_this.getInnerHtml(i))
        }
      }
      return temp
    },

    getValue: function () {
      return this.curValue
    },

    calcDistance: function (index) {
      return 2 * this.liHeight - index * this.liHeight
    },

    setCurDistance: function (indexArr) {
      var _this = this
      var temp = []
      for (var i = 0; i < _this.slider.length; i++) {
        temp.push(_this.calcDistance(indexArr[i]))
        _this.movePosition(_this.slider[i], temp[i])
      }
      _this.curDistance = temp
    },

    fixPosition: function (distance) {
      return -(this.getIndex(distance) - 2) * this.liHeight
    },

    movePosition: function (theSlider, distance) {
      theSlider.style.webkitTransform = 'translate3d(0,' + distance +
              'px, 0)'
      theSlider.style.transform = 'translate3d(0,' + distance + 'px, 0)'
    },

    locatePosition: function (index, posIndex) {
      var _this = this
      this.curDistance[index] = this.calcDistance(posIndex)
      this.movePosition(this.slider[index], this.curDistance[index])
      if (_this.cascade) {
        _this.checkRange(index, _this.getIndexArr())
      }
    },

    updateCurDistance: function (theSlider, index) {
      if (theSlider.style.transform) {
        this.curDistance[index] = parseInt(
          theSlider.style.transform.split(',')[1])
      } else {
        this.curDistance[index] = parseInt(
          theSlider.style.webkitTransform.split(',')[1])
      }
    },

    getDistance: function (theSlider) {
      if (theSlider.style.transform) {
        return parseInt(theSlider.style.transform.split(',')[1])
      } else {
        return parseInt(theSlider.style.webkitTransform.split(',')[1])
      }
    },

    getInnerHtml: function (sliderIndex) {
      var _this = this
      var index = _this.getIndex(_this.curDistance[sliderIndex])
      return _this.slider[sliderIndex].getElementsByTagName(
        'li')[index].innerHTML
    },

    touch: function (event, theSlider, index) {
      var _this = this
      event = event || window.event
      switch (event.type) {
        case 'touchstart':
          _this.startY = event.touches[0].clientY
          _this.startY = parseInt(_this.startY)
          _this.standardDis = _this.startY
          _this.oldMoveY = _this.startY
          break

        case 'touchend':
          _this.moveEndY = parseInt(event.changedTouches[0].clientY)
          _this.offsetSum = _this.moveEndY - _this.startY
          _this.oversizeBorder = -(theSlider.getElementsByTagName(
            'li').length - 3) * _this.liHeight
          if (_this.offsetSum == 0) {
            // offsetSum为0,相当于点击事件
            // 0 1 [2] 3 4
            var clickOffetNum = parseInt((document.documentElement.clientHeight -
                          _this.moveEndY) / this.liHeight)
            if (clickOffetNum != 2) {
              var offset = clickOffetNum - 2
              var newDistance = _this.curDistance[index] +
                              (offset * _this.liHeight)
              if ((newDistance <= 2 * _this.liHeight) &&
                              (newDistance >= _this.oversizeBorder)) {
                _this.curDistance[index] = newDistance
                _this.movePosition(theSlider,
                  _this.curDistance[index])
                _this.transitionEnd(_this.getIndexArr(),
                  _this.getCurValue())
              }
            }
          } else {
            // 修正位置
            _this.updateCurDistance(theSlider, index)
            _this.curDistance[index] = _this.fixPosition(
              _this.curDistance[index])

            _this.movePosition(theSlider, _this.curDistance[index])
            // 反弹
            if (_this.curDistance[index] + _this.offsetSum >
                          2 * _this.liHeight) {
              _this.curDistance[index] = 2 * _this.liHeight
              setTimeout(function () {
                _this.movePosition(theSlider,
                  _this.curDistance[index])
              }, 100)
            } else if (_this.curDistance[index] + _this.offsetSum <
                          _this.oversizeBorder) {
              _this.curDistance[index] = _this.oversizeBorder
              setTimeout(function () {
                _this.movePosition(theSlider,
                  _this.curDistance[index])
              }, 100)
            }
            _this.transitionEnd(_this.getIndexArr(),
              _this.getCurValue())
          }
          if (_this.cascade) {
            _this.checkRange(index, _this.getIndexArr())
          }

          break

        case 'touchmove':
          event.preventDefault()
          if (event.targetTouches.length > 1 ||
                      event.scale && event.scale !== 1) return
          _this.moveY = event.touches[0].clientY
          _this.offset = _this.moveY - _this.oldMoveY
          _this.offset = Math.abs(_this.moveY - _this.standardDis) >
                  2 * _this.liHeight ? _this.offset * 5 : _this.offset
          //  取到现在的transform
          _this.updateCurDistance(theSlider, index)
          _this.curDistance[index] = _this.curDistance[index] +
                      _this.offset
          _this.movePosition(theSlider, _this.curDistance[index])
          _this.oldMoveY = _this.moveY
          break
      }
    },

    dragClick: function (event, theSlider, index) {
      var _this = this
      event = event || window.event
      switch (event.type) {
        case 'mousedown':
          _this.startY = event.clientY
          _this.oldMoveY = _this.startY
          _this.clickStatus = true
          break

        case 'mouseup':

          _this.moveEndY = event.clientY
          _this.offsetSum = _this.moveEndY - _this.startY
          _this.oversizeBorder = -(theSlider.getElementsByTagName(
            'li').length - 3) * _this.liHeight

          if (_this.offsetSum == 0) {
            var clickOffetNum = parseInt((document.documentElement.clientHeight -
                          _this.moveEndY) / this.liHeight)
            if (clickOffetNum != 2) {
              var offset = clickOffetNum - 2
              var newDistance = _this.curDistance[index] +
                              (offset * _this.liHeight)
              if ((newDistance <= 2 * _this.liHeight) &&
                              (newDistance >= _this.oversizeBorder)) {
                _this.curDistance[index] = newDistance
                _this.movePosition(theSlider,
                  _this.curDistance[index])
                _this.transitionEnd(_this.getIndexArr(),
                  _this.getCurValue())
              }
            }
          } else {
            // 修正位置
            _this.updateCurDistance(theSlider, index)
            _this.curDistance[index] = _this.fixPosition(
              _this.curDistance[index])
            _this.movePosition(theSlider, _this.curDistance[index])

            // 反弹
            if (_this.curDistance[index] + _this.offsetSum >
                          2 * _this.liHeight) {
              _this.curDistance[index] = 2 * _this.liHeight
              setTimeout(function () {
                _this.movePosition(theSlider,
                  _this.curDistance[index])
              }, 100)
            } else if (_this.curDistance[index] + _this.offsetSum <
                          _this.oversizeBorder) {
              _this.curDistance[index] = _this.oversizeBorder
              setTimeout(function () {
                _this.movePosition(theSlider,
                  _this.curDistance[index])
              }, 100)
            }
            _this.transitionEnd(_this.getIndexArr(),
              _this.getCurValue())
          }

          _this.clickStatus = false
          if (_this.cascade) {
            _this.checkRange(index, _this.getIndexArr())
          }
          break

        case 'mousemove':
          event.preventDefault()
          if (_this.clickStatus) {
            _this.moveY = event.clientY
            _this.offset = _this.moveY - _this.oldMoveY
            _this.updateCurDistance(theSlider, index)
            _this.curDistance[index] = _this.curDistance[index] +
                          _this.offset
            _this.movePosition(theSlider, _this.curDistance[index])
            _this.oldMoveY = _this.moveY
          }
          break
      }
    }

  }

  if (typeof exports === 'object') {
    module.exports = PickerExtend
  } else if (typeof define === 'function' && define.amd) {
    define([], function () {
      return PickerExtend
    })
  } else {
    window.PickerExtend = PickerExtend
  }
})()
