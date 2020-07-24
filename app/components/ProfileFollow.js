import React, { useEffect, useState, useContext } from "react"
import Axios from "axios";

import { useParams, Link } from 'react-router-dom'

import LoadingDotsIcon from './LoadingDotsIcon';
import StateContext from '../StateContext'

function ProfileFollow(props) {
   const { username } = useParams()
   const [isLoading, setIsLoading] = useState(true)
   const [follow, setFollow] = useState([])
   const appState = useContext(StateContext)

   useEffect(() => {
      const ourRequest = Axios.CancelToken.source()
      async function fetchPosts() {
         try {
            const response = await Axios.get(`/profile/${username}/${props.action}`, { cancelToken: ourRequest.token })
            setFollow(response.data)
            setIsLoading(false)
         } catch (e) {
            console.log('There was a problem');
         }
      }

      fetchPosts()
      return (() => {
         ourRequest.cancel()
      })
   }, [username, props.action]);

   if (isLoading) {
      return <LoadingDotsIcon />
   }
   return (
      <div className="list-group">
         {follow.map((followItem, index) => {
            return (
               <Link key={index} to={`/profile/${followItem.username}`} className="list-group-item list-group-item-action" >
                  <img className="avatar-tiny" src={followItem.avatar} />{' '}{followItem.username}
               </Link>
            )
         })}
      </div>
   )
}

export default ProfileFollow