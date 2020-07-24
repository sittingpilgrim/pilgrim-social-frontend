
import React, { useState, useReducer, useEffect, Suspense } from 'react'
import ReactDOM from 'react-dom'
import { useImmerReducer } from 'use-immer'
import { BrowserRouter, Switch, Route } from 'react-router-dom'
import { CSSTransition } from 'react-transition-group'

import Axios from 'axios'
// Axios.defaults.baseURL = 'http://localhost:8080' // from dev
Axios.defaults.baseURL = process.env.BACKENDURL || 'https://pilgrim-social-backend.herokuapp.com'

import Header from './components/Header'
import Home from './components/Home'
import HomeGuest from './components/HomeGuest'
import Footer from './components/Footer'
import About from './components/About'
import Terms from './components/Terms'
import FlashMessages from './components/FlashMessages'
import Profile from './components/Profile'
import EditPost from './components/EditPost'
import LoadingDotsIcon from './components/LoadingDotsIcon'

import StateContext from './StateContext'
import DispatchContext from './DispatchContext'
import NotFound from './components/NotFound'

// lazy loaded 
const CreatePost = React.lazy(() => import('./components/CreatePost'))
const ViewSinglePost = React.lazy(() => import('./components/ViewSinglePost'))
const Search = React.lazy(() => import('./components/Search'))
const Chat = React.lazy(() => import('./components/Chat'))

function Main() {

   const initialState = {
      loggedIn: Boolean(localStorage.getItem('complexAppToken')),
      flashMessages: [],
      user: {
         token: localStorage.getItem('complexAppToken'),
         username: localStorage.getItem('complexAppUsername'),
         avatar: localStorage.getItem('complexAppAvatar'),
      },
      isSearchOpen: false,
      isChatOpen: false,
      unreadChatCount: 0
   }


   function ourReducer(draftState, action) {
      switch (action.type) {
         case 'login':
            draftState.loggedIn = true
            draftState.user = action.data
            // return { loggedIn: true, flashMessages: state.flashMessages }
            break;
         case 'logout':
            draftState.loggedIn = false;
            // return { loggedIn: false, flashMessages: state.flashMessages }
            break;
         case 'flashMessage':
            draftState.flashMessages.push(action.value)
            // return { loggedIn: state.loggedIn, flashMessages: state.flashMessages.concat(action.value) }
            break;
         case 'openSearch':
            draftState.isSearchOpen = true
            break;
         case 'closeSearch':
            draftState.isSearchOpen = false
            break;
         case 'toggleChat':
            draftState.isChatOpen = !draftState.isChatOpen
            break;
         case 'closeChat':
            draftState.isChatOpen = false
            break;
         case 'incrementUnreadChatCount':
            draftState.unreadChatCount++
            break;
         case 'clearUnreadChatCount':
            draftState.unreadChatCount = 0
            break;
         default:
            break;
      }
   }
   const [state, dispatch] = useImmerReducer(ourReducer, initialState)

   useEffect(() => {
      if (state.loggedIn) {
         localStorage.setItem('complexAppToken', state.user.token)
         localStorage.setItem('complexAppUsername', state.user.username)
         localStorage.setItem('complexAppAvatar', state.user.avatar)
      } else {
         localStorage.removeItem('complexAppToken')
         localStorage.removeItem('complexAppUsername')
         localStorage.removeItem('complexAppAvatar')
      }
   }, [state.loggedIn]);


   useEffect(() => {
      if (state.loggedIn > 0) {
         // check if token has expired
         const ourRequest = Axios.CancelToken.source()
         async function fetchResults() {
            try {
               const response = await Axios.post('/checkToken', { token: state.user.token }, { cancelToken: ourRequest.token })
               if (!response.data) { // token expired
                  dispatch({ type: 'logout' })
                  dispatch({ type: 'flashMessage', value: 'Your session has expired.  Please log in again.' })
               }
            } catch (e) {
               console.log('There was a problem, or the request was canceled');
            }
         }
         fetchResults()
         return () => ourRequest.cancel()
      }
   }, []);

   return (
      // <ExampleContext.Provider value={{ addFlashMessage, setLoggedIn }}>
      // <ExampleContext.Provider value={{ state, dispatch }}>
      <StateContext.Provider value={state}>
         <DispatchContext.Provider value={dispatch}>
            <BrowserRouter>
               <FlashMessages messages={state.flashMessages} />
               <Header />

               <Suspense fallback={<LoadingDotsIcon />}>
                  <Switch>
                     <Route path="/" exact>
                        {state.loggedIn ? <Home /> : <HomeGuest />}
                     </Route>

                     <Route path="/create-post">
                        <CreatePost />
                     </Route>

                     <Route path="/post/:postID" exact>
                        <ViewSinglePost />
                     </Route>

                     <Route path="/post/:postID/edit" exact>
                        <EditPost />
                     </Route>

                     <Route path="/about-us" exact>
                        <About />
                     </Route>

                     <Route path="/terms" exact>
                        <Terms />
                     </Route>

                     <Route path="/profile/:username">
                        <Profile />
                     </Route>

                     {/* fallback  */}
                     <Route>
                        <NotFound />
                     </Route>

                  </Switch>
               </Suspense>
               <CSSTransition timeout={330} in={state.isSearchOpen} classNames='search-overlay' unmountOnExit>
                  <div className='search-overlay'> { /* we have this here to allow lazy loading of search component */}
                     <Suspense fallback=''>
                        <Search />
                     </Suspense>
                  </div>
               </CSSTransition>
               <Suspense fallback=''>
                  {state.loggedIn && <Chat />}
               </Suspense>
               <Footer />
            </BrowserRouter>
         </DispatchContext.Provider>
      </StateContext.Provider>
      // </ExampleContext.Provider>
   )
}

ReactDOM.render(<Main />, document.querySelector("#app"))

if (module.hot) {
   module.hot.accept()

}