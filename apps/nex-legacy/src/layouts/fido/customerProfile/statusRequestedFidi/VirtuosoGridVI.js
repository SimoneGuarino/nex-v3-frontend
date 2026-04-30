import React, { Fragment } from 'react';
//@Internal Packages
import styled from '@emotion/styled'

//@External Packages
import { Virtuoso } from 'react-virtuoso';
//import styled from '@emotion/styled';
import { Fade, Stack } from '@mui/material';
import Skeleton from '@mui/material/Skeleton';
import FidoStatusCard from './fidoStatusCard';



const ItemContainer = styled.div`
  padding: 0.5rem;
  width: 100%;
  flex: 100%;
  display: flex;
  align-content: stretch;
  box-sizing: border-box;
  transition: all 300ms cubic-bezier(0.4, 0, 0.2, 1) 0ms !important;
`

const ListContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
`

const VirtuosoGridVI = React.memo(({ data, CreateChat }) => {

  const virtuosoGridRef = React.useRef(null);

  const [visibleRange, setVisibleRange] = React.useState({
    startIndex: 0,
    endIndex: 0,
  })

  const renderRow = React.useCallback((index, elm) => {
    return <FidoStatusCard key_prop={index} index={index} elm={elm} CreateChat={CreateChat}/>;
  },[visibleRange, data])


  const memoRender = React.useMemo(() => (
      <Stack direction='row' height="100%" width='100%' translate="no">
        <Virtuoso
        ref={virtuosoGridRef}
          style={{ height: '100%', width: '100%' }}
          overscan={10}
          totalCount={data.length}
          components={{
            Item: ItemContainer,
            List: ListContainer,
          }}
          rangeChanged={setVisibleRange}
          itemContent={index => renderRow(index, data[index])}

        />
      </Stack>
  ), [data])

  return memoRender;
});

export default VirtuosoGridVI;