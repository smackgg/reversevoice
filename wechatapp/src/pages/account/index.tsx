import { ComponentClass } from 'react'
import Taro, { Component, Config } from '@tarojs/taro'
import { connect } from '@tarojs/redux'
import { View } from '@tarojs/components'
import classNames from 'classnames'
// import { AtIcon } from 'taro-ui'
import { UserDetail } from '@/redux/reducers/user'
import { AtAccordion, AtList, AtListItem } from 'taro-ui'
import moment from 'moment'
import './index.scss'

moment.locale('zh-cn', {
  meridiem: (hour, minute) => {
    if (hour < 9) {
      return '早上'
    } if (hour < 11 && minute < 30) {
      return '上午'
    } if (hour < 13 && minute < 30) {
      return '中午'
    } if (hour < 18) {
      return '下午'
    }
    return '晚上'
  },
})


// #region 书写注意
//
// 目前 typescript 版本还无法在装饰器模式下将 Props 注入到 Taro.Component 中的 props 属性
// 需要显示声明 connect 的参数类型并通过 interface 的方式指定 Taro.Component 子类的 props
// 这样才能完成类型检查和 IDE 的自动提示
// 使用函数模式则无此限制
// ref: https://github.com/DefinitelyTyped/DefinitelyTyped/issues/20796
//
// #endregion

type PageStateProps = {
  userDetail: UserDetail
}

type PageDispatchProps = {
}

type PageOwnProps = {
}


type PageState = {
  showRooms: boolean;
  showJoinedRooms: boolean;
}

type IProps = PageStateProps & PageDispatchProps & PageOwnProps

interface Account {
  props: IProps
}

@connect(({ user }) => ({
  userDetail: user.userDetail,
}))

class Account extends Component {
  /**
 * 指定config的类型声明为: Taro.Config
 *
 * 由于 typescript 对于 object 类型推导只能推出 Key 的基本类型
 * 对于像 navigationBarTextStyle: 'black' 这样的推导出的类型是 string
 * 提示和声明 navigationBarTextStyle: 'black' | 'white' 类型冲突, 需要显示声明类型
 */
  config: Config = {
    navigationBarTitleText: '我的',
  }

  state: PageState = {
    showRooms: false,
    showJoinedRooms: false,
  }

  componentDidShow() {
    // this.getFiles()
  }

  toggleRooms = () => this.setState({ showRooms: !this.state.showRooms })

  toggleJoinedRooms = () => this.setState({ showJoinedRooms: !this.state.showJoinedRooms })
  // 格式化日期
  getDate = (d: Date) => {
    const date = moment(d)
    return {
      date: date.format('YYYY.MM.DD'),
      time: date.format('A h:mm'),
    }
  }

  goRoom = (roomId: string) => {
    Taro.navigateTo({
      url: `/pages/room/index?roomId=${roomId}`,
    })
  }

  render() {
    const { showRooms, showJoinedRooms } = this.state
    const { rooms = [], joinedRooms = [], profile: { avatarUrl, nickName } } = this.props.userDetail

    return (
      <View className="account">
        <AtAccordion
          open={showRooms}
          onClick={this.toggleRooms}
          title={`我发起的挑战(${rooms.length})`}
        >
          <AtList hasBorder={false}>
            {
              rooms.map(room => {
                const { date, time } = this.getDate(new Date(room.createAt))
                return <AtListItem
                  key={room.id}
                  title={date + ' ' + time}
                  note={`发起挑战者：${nickName}`}
                  thumb={avatarUrl}
                  onClick={this.goRoom.bind(this, room.id)}
                />
              })
            }
          </AtList>
        </AtAccordion>

        <AtAccordion
          open={showJoinedRooms}
          onClick={this.toggleJoinedRooms}
          title={`我发起的挑战(${joinedRooms.length})`}
        >
          <AtList hasBorder={false}>
            {
              joinedRooms.map(room => {
                const { date, time } = this.getDate(new Date(room.createAt))
                return <AtListItem
                  key={room.id}
                  title={date + ' ' + time}
                  note={`发起挑战者：${room.owner.nickName}`}
                  thumb={room.owner.avatarUrl}
                  onClick={this.goRoom.bind(this, room.id)}
                />
              })
            }
          </AtList>
        </AtAccordion>
      </View>
    )
  }
}

// #region 导出注意
//
// 经过上面的声明后需要将导出的 Taro.Component 子类修改为子类本身的 props 属性
// 这样在使用这个子类时 Ts 才不会提示缺少 JSX 类型参数错误
//
// #endregion

export default Account as ComponentClass<PageOwnProps, PageState>
