import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { createMaterialBottomTabNavigator } from '@react-navigation/material-bottom-tabs';
import { NavigationContainer, useNavigation } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack'
import React, { useEffect, useState, useReducer, createContext, useContext } from 'react';
import { Animated, Dimensions, ScrollView, StatusBar, StyleSheet, View, AppState } from 'react-native';
import { Button, Input, PricingCard, Text, Icon } from 'react-native-elements';

const SCREEN_WIDTH = Dimensions.get('window').width
const SWIPE_THRESHOLD = 0.25 * SCREEN_WIDTH


const Tab = createMaterialBottomTabNavigator()
const Stack = createStackNavigator()

function wait(timeout) {
	return new Promise(resolve => {
		setTimeout(resolve, timeout)
	})
}

function Card(props) {
	var text_header = null
	var color = null

	if (props.importance === 0) {
		text_header = 'Important'
		color = { backgroundColor: '#d9534f' }
	} else if (props.importance === 1) {
		text_header = 'Mild'
		color = { backgroundColor: '#0275d8' }
	} else if (props.importance === 2) {
		text_header = 'Not Important'
		color = { backgroundColor: '#5cb85c' }
	} else {
		text_header = 'Default (NOVALUE)'
		color = { backgroundColor: '#f0ad4e' }
	}

	const date = new Date(props.time)

	return (
		<PricingCard color={color.backgroundColor} title={text_header} price={props.news} button={{ title: 'Remove' }} onButtonPress={() => props.remove(props.id)} />
	)
}

function Add(props) {
	const [news, setNews] = useState()
	const [importance, setImportance] = useState(0)
	const [loading, setLoading] = useState()

	const navigation = useNavigation()

	function addList() {
		firestore().collection('paper').add({ 'news': news, 'importance': importance, 'time': Date.now() })
			.then(() => {
				navigation.goBack()
			})
			.catch(e => {
				console.error(e)
			})
	}

	return (
		<View style={{ flex: 1, marginVertical: 20 }}>
			<View style={{ marginHorizontal: '5%', paddingVertical: '5%', borderWidth: 1, flexDirection: 'column', justifyContent: 'center', alignItems: 'center', alignContent: 'center' }}>
				<Text style={styles.titleText}>News:</Text>
				<Input style={styles.baseText} defaultValue='' placeholder='News' onChangeText={text => setNews(text)}></Input>
				<Text style={styles.titleText}>Importance:</Text>
				{/* <Picker selectedValue={importance} style={{ height: 50, width: 200 }} onValueChange={(itemValue, itemIndex) => setImportance(itemValue)}>
					<Picker.Item label='Very important' value={0} />
					<Picker.Item label='News' value={1} />
					<Picker.Item label='Not important' value={2} />
				</Picker> */}
				<Button title='submit' onPress={() => (addList())} />
			</View>
		</View>
	)
}

function Account(props) {
	const navigation = useNavigation()

	function logout() {
		auth().signOut()
		navigation.navigate('homepage', { screen: 'login' })
	}

	return (
		<View style={styles.containerform}>
			<Button title='logout' onPress={logout} />
		</View>
	)

}

const AuthContext = createContext({ error: '', signin: () => { } })

export function App() {
	const [state, dispatch] = useReducer((state, action) => {
		switch (action.type) {
			case 'SIGNOUT':
				return {
					...state,
					user: null,
					error: ''
				}
			case 'SIGNIN':
				return {
					...state,
					user: action.user,
					error: ''
				}
			case 'ERROR':
				return {
					...state,
					error: action.error
				}
		}
	}, { user: auth().currentUser, error: '' })

	async function signin(email, pass) {
		if (email == null && pass != null) {
			dispatch({ type: 'ERROR', error: 'Email input is empty!' })
		} else if (email != null && pass == null) {
			dispatch({ type: 'ERROR', error: 'Pass input is empty!' })
		} else if (email == null && pass == null) {
			dispatch({ type: 'ERROR', error: 'Email and pass inputs are empty!' })
		} else {
			auth().signInWithEmailAndPassword(email, pass)
				.then((user) => dispatch({ type: 'SIGNIN', user: user.user.getIdToken() }))
				.catch(e => {
					dispatch({ type: 'ERROR', error: e.message })
					console.log(e)
				})
		}


	}

	function logout() {
		auth().signOut()
			.then(() => dispatch({ type: 'SIGNOUT' }))
			.catch(e => console.log(e))
	}

	function homepage() {
		return (
			<Tab.Navigator>
				<Tab.Screen name='home' component={Home} options={{ tabBarLabel: 'Home', tabBarIcon: ({ color }) => <Icon name='home' /> }} />
				<Tab.Screen name='add' component={Add} options={{ tabBarLabel: 'Home', tabBarIcon: ({ color }) => <Icon name='list' /> }} />
				<Tab.Screen name='account' component={Account} options={{ tabBarLabel: 'Account', tabBarIcon: ({ color }) => <Icon name='face' /> }} />
			</Tab.Navigator >
		)
	}

	return (
		<NavigationContainer>
			<StatusBar hidden={true}></StatusBar>
			<AuthContext.Provider value={{ error: state.error, signin: (email, pass) => signin(email, pass) }}>
				<Stack.Navigator headerMode='screen'>
					{
						state.user == null ? (
							<Stack.Screen name='Login' component={login} state={state.error} signin={signin} />
						) : (
								<Stack.Screen name='Homepage' component={homepage} options={{
									headerRight: () => <Button title='Logout' type='clear' titleStyle={{ color: 'black', fontSize: 19 }} containerStyle={{ marginRight: 5 }} onPress={() => logout()} />
								}} />)
					}
				</Stack.Navigator>
			</AuthContext.Provider>

		</NavigationContainer >
	)
}

function login() {
	const [email, setEmail] = React.useState()
	const [pass, setPass] = React.useState()

	const context = useContext(AuthContext)

	return (
		<View style={styles.container}>
			<View style={styles.containerform}>
				<Input
					label='Your Email Address'
					placeholder='email@address.com'
					onChangeText={(text) => { setEmail(text) }}
					containerStyle={styles.input}
					leftIcon={{ type: 'material', name: 'email' }}
					leftIconContainerStyle={{ marginLeft: 0 }} />
				<Input
					label='Password'
					placeholder='Password'
					onChangeText={(text) => { setPass(text) }}
					containerStyle={styles.input}
					leftIcon={{ type: 'material', name: 'lock' }}
					leftIconContainerStyle={{ marginLeft: 0 }}
					secureTextEntry={true}
					errorMessage={context.error}
				/>
				<Button title='SignIn' onPress={() => context.signin(email, pass)} type='solid' loading={false} buttonStyle={styles.button} />
			</View>
		</View>
	)
}

function Home(props) {
	const [status, setStatus] = useState()
	const [data, changeData] = useState([])
	const [refreshing, setRefereshing] = useState(false)
	const [userToken, setUsertoken] = useState()

	function updateList() {
		firestore().collection('paper').orderBy('time', 'desc').get().then(query => {
			changeData(query.docs)
		}).catch(error => {
			Alert.alert(error)
		})
	}

	async function remove(id) {
		firestore().collection('paper').doc(id).delete()
			.then(() => {
				updateList()
			})
			.catch(e => {
				console.error(e)
			})
	}

	useEffect(() => {
		return firestore().collection('paper').onSnapshot((query) => {
			updateList()
		})
	}, [status])

	function onRefresh() {
		setRefereshing(true)
		wait(2000).then(() => setRefereshing(false))
	}

	return (
		<ScrollView padder contentContainerStyle={styles.grow}>
			{
				data.map((doc, index) => {

					if (index === 0) {
						return (
							<Card id={doc.id} news={doc.data().news} importance={doc.data().importance} time={doc.data().time} remove={remove} />
						)
					} else {
						return (
							<Card id={doc.id} news={doc.data().news} importance={doc.data().importance} time={doc.data().time} remove={remove} />
						)
					}


				})
			}
		</ScrollView>

	)
}

const styles = StyleSheet.create({
	text: {
		fontSize: 20,
	},
	input: {
		width: '80%',
		margin: 8,
	},
	container: {
		flex: 1,
		backgroundColor: '#fff',
		justifyContent: 'center',
		alignContent: 'center'
	},

	button: {
		width: 100,
	},
	titleText: {
		fontSize: 30,
		fontWeight: 'bold'
	},
	baseText: {
		fontSize: 20
	},
	container: {
		backgroundColor: '#fff',
		height: '100%',
		width: '100%'
	},
	containerform: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center'
	},
});